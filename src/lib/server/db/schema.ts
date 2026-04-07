import {
	pgTable,
	text,
	boolean,
	timestamp,
	integer,
	numeric,
	date,
	jsonb,
	primaryKey
} from 'drizzle-orm/pg-core';

export const user = pgTable('user', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: boolean('email_verified').notNull(),
	image: text('image'),
	createdAt: timestamp('created_at').notNull(),
	updatedAt: timestamp('updated_at').notNull(),
	// Admin plugin fields
	role: text('role').default('user'),
	banned: boolean('banned').default(false),
	banReason: text('ban_reason'),
	banExpires: timestamp('ban_expires'),
	// 2FA plugin field
	twoFactorEnabled: boolean('two_factor_enabled').default(false)
});

export const session = pgTable('session', {
	id: text('id').primaryKey(),
	expiresAt: timestamp('expires_at').notNull(),
	token: text('token').notNull().unique(),
	createdAt: timestamp('created_at').notNull(),
	updatedAt: timestamp('updated_at').notNull(),
	ipAddress: text('ip_address'),
	userAgent: text('user_agent'),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	activeOrganizationId: text('active_organization_id')
});

export const account = pgTable('account', {
	id: text('id').primaryKey(),
	accountId: text('account_id').notNull(),
	providerId: text('provider_id').notNull(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	accessToken: text('access_token'),
	refreshToken: text('refresh_token'),
	idToken: text('id_token'),
	accessTokenExpiresAt: timestamp('access_token_expires_at'),
	refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
	scope: text('scope'),
	password: text('password'),
	createdAt: timestamp('created_at').notNull(),
	updatedAt: timestamp('updated_at').notNull()
});

export const verification = pgTable('verification', {
	id: text('id').primaryKey(),
	identifier: text('identifier').notNull(),
	value: text('value').notNull(),
	expiresAt: timestamp('expires_at').notNull(),
	createdAt: timestamp('created_at'),
	updatedAt: timestamp('updated_at')
});

export const organization = pgTable('organization', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	slug: text('slug').unique(),
	logo: text('logo'),
	createdAt: timestamp('created_at').notNull(),
	metadata: text('metadata')
});

export const member = pgTable('member', {
	id: text('id').primaryKey(),
	organizationId: text('organization_id')
		.notNull()
		.references(() => organization.id),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	role: text('role').notNull(),
	createdAt: timestamp('created_at').notNull()
});

export const invitation = pgTable('invitation', {
	id: text('id').primaryKey(),
	organizationId: text('organization_id')
		.notNull()
		.references(() => organization.id),
	email: text('email').notNull(),
	role: text('role'),
	status: text('status').notNull(),
	expiresAt: timestamp('expires_at').notNull(),
	inviterId: text('inviter_id')
		.notNull()
		.references(() => user.id)
});

export const twoFactorTable = pgTable('two_factor', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	secret: text('secret').notNull(),
	backupCodes: text('backup_codes').notNull(),
	createdAt: timestamp('created_at').notNull()
});

// ============================================================================
// BrokerOS CRM Tables
// ============================================================================

export const client = pgTable('client', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	organizationId: text('organization_id')
		.notNull()
		.references(() => organization.id, { onDelete: 'cascade' }),
	type: text('type').notNull().default('individual'),
	name: text('name').notNull(),
	email: text('email'),
	phone: text('phone'),
	idNumber: text('id_number'),
	registrationNumber: text('registration_number'),
	address: text('address'),
	createdById: text('created_by_id')
		.notNull()
		.references(() => user.id),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const policy = pgTable('policy', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	organizationId: text('organization_id')
		.notNull()
		.references(() => organization.id, { onDelete: 'cascade' }),
	clientId: text('client_id')
		.notNull()
		.references(() => client.id, { onDelete: 'cascade' }),
	policyNumber: text('policy_number').notNull(),
	insurer: text('insurer').notNull(),
	type: text('type').notNull().default('other'),
	status: text('status').notNull().default('active'),
	startDate: date('start_date'),
	endDate: date('end_date'),
	premium: numeric('premium', { precision: 12, scale: 2 }),
	isActivePrimary: boolean('is_active_primary').notNull().default(false),
	createdById: text('created_by_id')
		.notNull()
		.references(() => user.id),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const claim = pgTable('claim', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	organizationId: text('organization_id')
		.notNull()
		.references(() => organization.id, { onDelete: 'cascade' }),
	clientId: text('client_id')
		.notNull()
		.references(() => client.id, { onDelete: 'cascade' }),
	policyId: text('policy_id').references(() => policy.id, { onDelete: 'set null' }),
	claimNumber: text('claim_number').notNull(),
	status: text('status').notNull().default('open'),
	description: text('description'),
	dateOfLoss: date('date_of_loss'),
	amountClaimed: numeric('amount_claimed', { precision: 12, scale: 2 }),
	amountSettled: numeric('amount_settled', { precision: 12, scale: 2 }),
	createdById: text('created_by_id')
		.notNull()
		.references(() => user.id),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const task = pgTable('task', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	organizationId: text('organization_id')
		.notNull()
		.references(() => organization.id, { onDelete: 'cascade' }),
	title: text('title').notNull(),
	description: text('description'),
	taskType: text('task_type').notNull().default('general'),
	workflowKey: text('workflow_key'),
	status: text('status').notNull().default('todo'),
	priority: text('priority').notNull().default('medium'),
	dueDate: timestamp('due_date'),
	assignedToId: text('assigned_to_id').references(() => user.id, { onDelete: 'set null' }),
	createdById: text('created_by_id')
		.notNull()
		.references(() => user.id),
	clientId: text('client_id').references(() => client.id, { onDelete: 'set null' }),
	policyId: text('policy_id').references(() => policy.id, { onDelete: 'set null' }),
	claimId: text('claim_id').references(() => claim.id, { onDelete: 'set null' }),
	completedAt: timestamp('completed_at'),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const taskWatcher = pgTable('task_watcher', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	taskId: text('task_id')
		.notNull()
		.references(() => task.id, { onDelete: 'cascade' }),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' })
});

export const document = pgTable('document', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	organizationId: text('organization_id')
		.notNull()
		.references(() => organization.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	fileName: text('file_name').notNull(),
	mimeType: text('mime_type').notNull(),
	size: integer('size').notNull(),
	storagePath: text('storage_path').notNull(),
	clientId: text('client_id').references(() => client.id, { onDelete: 'set null' }),
	policyId: text('policy_id').references(() => policy.id, { onDelete: 'set null' }),
	claimId: text('claim_id').references(() => claim.id, { onDelete: 'set null' }),
	taskId: text('task_id').references(() => task.id, { onDelete: 'set null' }),
	uploadedById: text('uploaded_by_id')
		.notNull()
		.references(() => user.id),
	createdAt: timestamp('created_at').notNull().defaultNow()
});

export const tag = pgTable('tag', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	organizationId: text('organization_id').references(() => organization.id, {
		onDelete: 'cascade'
	}),
	name: text('name').notNull(),
	isSystem: boolean('is_system').notNull().default(false),
	createdAt: timestamp('created_at').notNull().defaultNow()
});

export const documentTag = pgTable(
	'document_tag',
	{
		documentId: text('document_id')
			.notNull()
			.references(() => document.id, { onDelete: 'cascade' }),
		tagId: text('tag_id')
			.notNull()
			.references(() => tag.id, { onDelete: 'cascade' })
	},
	(t) => [primaryKey({ columns: [t.documentId, t.tagId] })]
);

export const note = pgTable('note', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	organizationId: text('organization_id')
		.notNull()
		.references(() => organization.id, { onDelete: 'cascade' }),
	clientId: text('client_id')
		.notNull()
		.references(() => client.id, { onDelete: 'cascade' }),
	content: text('content').notNull(),
	createdById: text('created_by_id')
		.notNull()
		.references(() => user.id),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const activity = pgTable('activity', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	organizationId: text('organization_id')
		.notNull()
		.references(() => organization.id, { onDelete: 'cascade' }),
	clientId: text('client_id'),
	entityType: text('entity_type').notNull(),
	entityId: text('entity_id').notNull(),
	action: text('action').notNull(),
	description: text('description').notNull(),
	metadata: jsonb('metadata'),
	performedById: text('performed_by_id')
		.notNull()
		.references(() => user.id),
	createdAt: timestamp('created_at').notNull().defaultNow()
});
