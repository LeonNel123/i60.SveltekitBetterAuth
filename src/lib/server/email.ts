import {
	EMAIL_PROVIDER,
	EMAIL_FROM,
	RESEND_API_KEY,
	SENDGRID_API_KEY,
	SMTP_HOST,
	SMTP_PORT,
	SMTP_USER,
	SMTP_PASS
} from '$env/static/private';

interface EmailMessage {
	to: string;
	subject: string;
	html: string;
	text?: string;
}

type SendFn = (message: EmailMessage) => Promise<void>;

function createResendSender(): SendFn {
	return async (message) => {
		const { Resend } = await import('resend');
		const resend = new Resend(RESEND_API_KEY);
		await resend.emails.send({
			from: EMAIL_FROM,
			to: message.to,
			subject: message.subject,
			html: message.html,
			text: message.text
		});
	};
}

function createSendGridSender(): SendFn {
	return async (message) => {
		const sgMail = await import('@sendgrid/mail');
		sgMail.default.setApiKey(SENDGRID_API_KEY);
		await sgMail.default.send({
			from: EMAIL_FROM,
			to: message.to,
			subject: message.subject,
			html: message.html,
			text: message.text
		});
	};
}

function createSmtpSender(): SendFn {
	return async (message) => {
		const nodemailer = await import('nodemailer');
		const transport = nodemailer.default.createTransport({
			host: SMTP_HOST,
			port: Number(SMTP_PORT) || 587,
			auth: { user: SMTP_USER, pass: SMTP_PASS }
		});
		await transport.sendMail({
			from: EMAIL_FROM,
			to: message.to,
			subject: message.subject,
			html: message.html,
			text: message.text
		});
	};
}

function createConsoleSender(): SendFn {
	return async (message) => {
		console.log(`[DEV EMAIL] To: ${message.to}`);
		console.log(`[DEV EMAIL] Subject: ${message.subject}`);
		console.log(`[DEV EMAIL] Body: ${message.text ?? message.html}`);
	};
}

function getSender(): SendFn {
	switch (EMAIL_PROVIDER) {
		case 'resend':
			return createResendSender();
		case 'sendgrid':
			return createSendGridSender();
		case 'smtp':
			return createSmtpSender();
		default:
			return createConsoleSender();
	}
}

const sender = getSender();

export async function sendEmail(message: EmailMessage): Promise<void> {
	try {
		await sender(message);
	} catch (error) {
		console.error('[EMAIL] Failed to send:', error);
	}
}
