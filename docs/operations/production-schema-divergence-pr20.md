# Divergencia de esquema de producción — PR #20

Documento generado por `tools/db/schema-inventory.mjs`. No autoriza cambios en producción.

- Fingerprint canónico: `06d448482d390bbb7dada5afea83d9b59fe9de02221365a49bdb4dd6a0d4a88c`
- Fingerprint clon: `ea92bd296ad42aeb5de177aac81ba3d59bac94081c3fc38b045080fce4da00c8`
- Objetos divergentes: 133

## Resumen

| Tipo | Idénticos | Solo clon | Solo canónica | Definición diferente |
|---|---:|---:|---:|---:|
| tables | 137 | 9 | 0 | 0 |
| columns | 1619 | 76 | 0 | 0 |
| indexes | 474 | 21 | 0 | 0 |
| constraints | 414 | 19 | 0 | 0 |
| enums | 24 | 0 | 0 | 0 |
| domains | 0 | 0 | 0 | 0 |
| compositeTypes | 0 | 0 | 0 | 0 |
| sequences | 3 | 0 | 0 | 0 |
| extensions | 5 | 1 | 0 | 0 |
| routines | 187 | 7 | 0 | 0 |
| triggers | 2 | 0 | 0 | 0 |
| views | 0 | 0 | 0 | 0 |
| materializedViews | 0 | 0 | 0 | 0 |
| policies | 0 | 0 | 0 | 0 |

## Evidencia

### neon_auth.account

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","name":"account","type":"table","persistence":"p","is_partition":false,"partition_key":null,"parent_schema":null,"parent_table":null,"rls":false,"rls_forced":false}`

### neon_auth.invitation

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","name":"invitation","type":"table","persistence":"p","is_partition":false,"partition_key":null,"parent_schema":null,"parent_table":null,"rls":false,"rls_forced":false}`

### neon_auth.jwks

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","name":"jwks","type":"table","persistence":"p","is_partition":false,"partition_key":null,"parent_schema":null,"parent_table":null,"rls":false,"rls_forced":false}`

### neon_auth.member

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","name":"member","type":"table","persistence":"p","is_partition":false,"partition_key":null,"parent_schema":null,"parent_table":null,"rls":false,"rls_forced":false}`

### neon_auth.organization

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","name":"organization","type":"table","persistence":"p","is_partition":false,"partition_key":null,"parent_schema":null,"parent_table":null,"rls":false,"rls_forced":false}`

### neon_auth.project_config

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","name":"project_config","type":"table","persistence":"p","is_partition":false,"partition_key":null,"parent_schema":null,"parent_table":null,"rls":false,"rls_forced":false}`

### neon_auth.session

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","name":"session","type":"table","persistence":"p","is_partition":false,"partition_key":null,"parent_schema":null,"parent_table":null,"rls":false,"rls_forced":false}`

### neon_auth.user

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","name":"user","type":"table","persistence":"p","is_partition":false,"partition_key":null,"parent_schema":null,"parent_table":null,"rls":false,"rls_forced":false}`

### neon_auth.verification

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","name":"verification","type":"table","persistence":"p","is_partition":false,"partition_key":null,"parent_schema":null,"parent_table":null,"rls":false,"rls_forced":false}`

### neon_auth.account.accessToken

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"account","position":5,"name":"accessToken","full_type":"text","type_schema":"pg_catalog","internal_type":"text","length":null,"precision":null,"scale":null,"nullable":true,"default":null,"identity":"","generated":"","collation_schema":"pg_catalog","collation":"default"}`

### neon_auth.account.accessTokenExpiresAt

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"account","position":8,"name":"accessTokenExpiresAt","full_type":"timestamp with time zone","type_schema":"pg_catalog","internal_type":"timestamptz","length":null,"precision":null,"scale":null,"nullable":true,"default":null,"identity":"","generated":"","collation_schema":null,"collation":null}`

### neon_auth.account.accountId

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"account","position":2,"name":"accountId","full_type":"text","type_schema":"pg_catalog","internal_type":"text","length":null,"precision":null,"scale":null,"nullable":false,"default":null,"identity":"","generated":"","collation_schema":"pg_catalog","collation":"default"}`

### neon_auth.account.createdAt

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"account","position":12,"name":"createdAt","full_type":"timestamp with time zone","type_schema":"pg_catalog","internal_type":"timestamptz","length":null,"precision":null,"scale":null,"nullable":false,"default":"CURRENT_TIMESTAMP","identity":"","generated":"","collation_schema":null,"collation":null}`

### neon_auth.account.id

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"account","position":1,"name":"id","full_type":"uuid","type_schema":"pg_catalog","internal_type":"uuid","length":null,"precision":null,"scale":null,"nullable":false,"default":"gen_random_uuid()","identity":"","generated":"","collation_schema":null,"collation":null}`

### neon_auth.account.idToken

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"account","position":7,"name":"idToken","full_type":"text","type_schema":"pg_catalog","internal_type":"text","length":null,"precision":null,"scale":null,"nullable":true,"default":null,"identity":"","generated":"","collation_schema":"pg_catalog","collation":"default"}`

### neon_auth.account.password

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"account","position":11,"name":"password","full_type":"text","type_schema":"pg_catalog","internal_type":"text","length":null,"precision":null,"scale":null,"nullable":true,"default":null,"identity":"","generated":"","collation_schema":"pg_catalog","collation":"default"}`

### neon_auth.account.providerId

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"account","position":3,"name":"providerId","full_type":"text","type_schema":"pg_catalog","internal_type":"text","length":null,"precision":null,"scale":null,"nullable":false,"default":null,"identity":"","generated":"","collation_schema":"pg_catalog","collation":"default"}`

### neon_auth.account.refreshToken

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"account","position":6,"name":"refreshToken","full_type":"text","type_schema":"pg_catalog","internal_type":"text","length":null,"precision":null,"scale":null,"nullable":true,"default":null,"identity":"","generated":"","collation_schema":"pg_catalog","collation":"default"}`

### neon_auth.account.refreshTokenExpiresAt

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"account","position":9,"name":"refreshTokenExpiresAt","full_type":"timestamp with time zone","type_schema":"pg_catalog","internal_type":"timestamptz","length":null,"precision":null,"scale":null,"nullable":true,"default":null,"identity":"","generated":"","collation_schema":null,"collation":null}`

### neon_auth.account.scope

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"account","position":10,"name":"scope","full_type":"text","type_schema":"pg_catalog","internal_type":"text","length":null,"precision":null,"scale":null,"nullable":true,"default":null,"identity":"","generated":"","collation_schema":"pg_catalog","collation":"default"}`

### neon_auth.account.updatedAt

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"account","position":13,"name":"updatedAt","full_type":"timestamp with time zone","type_schema":"pg_catalog","internal_type":"timestamptz","length":null,"precision":null,"scale":null,"nullable":false,"default":null,"identity":"","generated":"","collation_schema":null,"collation":null}`

### neon_auth.account.userId

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"account","position":4,"name":"userId","full_type":"uuid","type_schema":"pg_catalog","internal_type":"uuid","length":null,"precision":null,"scale":null,"nullable":false,"default":null,"identity":"","generated":"","collation_schema":null,"collation":null}`

### neon_auth.invitation.createdAt

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"invitation","position":7,"name":"createdAt","full_type":"timestamp with time zone","type_schema":"pg_catalog","internal_type":"timestamptz","length":null,"precision":null,"scale":null,"nullable":false,"default":"CURRENT_TIMESTAMP","identity":"","generated":"","collation_schema":null,"collation":null}`

### neon_auth.invitation.email

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"invitation","position":3,"name":"email","full_type":"text","type_schema":"pg_catalog","internal_type":"text","length":null,"precision":null,"scale":null,"nullable":false,"default":null,"identity":"","generated":"","collation_schema":"pg_catalog","collation":"default"}`

### neon_auth.invitation.expiresAt

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"invitation","position":6,"name":"expiresAt","full_type":"timestamp with time zone","type_schema":"pg_catalog","internal_type":"timestamptz","length":null,"precision":null,"scale":null,"nullable":false,"default":null,"identity":"","generated":"","collation_schema":null,"collation":null}`

### neon_auth.invitation.id

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"invitation","position":1,"name":"id","full_type":"uuid","type_schema":"pg_catalog","internal_type":"uuid","length":null,"precision":null,"scale":null,"nullable":false,"default":"gen_random_uuid()","identity":"","generated":"","collation_schema":null,"collation":null}`

### neon_auth.invitation.inviterId

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"invitation","position":8,"name":"inviterId","full_type":"uuid","type_schema":"pg_catalog","internal_type":"uuid","length":null,"precision":null,"scale":null,"nullable":false,"default":null,"identity":"","generated":"","collation_schema":null,"collation":null}`

### neon_auth.invitation.organizationId

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"invitation","position":2,"name":"organizationId","full_type":"uuid","type_schema":"pg_catalog","internal_type":"uuid","length":null,"precision":null,"scale":null,"nullable":false,"default":null,"identity":"","generated":"","collation_schema":null,"collation":null}`

### neon_auth.invitation.role

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"invitation","position":4,"name":"role","full_type":"text","type_schema":"pg_catalog","internal_type":"text","length":null,"precision":null,"scale":null,"nullable":true,"default":null,"identity":"","generated":"","collation_schema":"pg_catalog","collation":"default"}`

### neon_auth.invitation.status

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"invitation","position":5,"name":"status","full_type":"text","type_schema":"pg_catalog","internal_type":"text","length":null,"precision":null,"scale":null,"nullable":false,"default":null,"identity":"","generated":"","collation_schema":"pg_catalog","collation":"default"}`

### neon_auth.jwks.createdAt

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"jwks","position":4,"name":"createdAt","full_type":"timestamp with time zone","type_schema":"pg_catalog","internal_type":"timestamptz","length":null,"precision":null,"scale":null,"nullable":false,"default":null,"identity":"","generated":"","collation_schema":null,"collation":null}`

### neon_auth.jwks.expiresAt

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"jwks","position":5,"name":"expiresAt","full_type":"timestamp with time zone","type_schema":"pg_catalog","internal_type":"timestamptz","length":null,"precision":null,"scale":null,"nullable":true,"default":null,"identity":"","generated":"","collation_schema":null,"collation":null}`

### neon_auth.jwks.id

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"jwks","position":1,"name":"id","full_type":"uuid","type_schema":"pg_catalog","internal_type":"uuid","length":null,"precision":null,"scale":null,"nullable":false,"default":"gen_random_uuid()","identity":"","generated":"","collation_schema":null,"collation":null}`

### neon_auth.jwks.privateKey

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"jwks","position":3,"name":"privateKey","full_type":"text","type_schema":"pg_catalog","internal_type":"text","length":null,"precision":null,"scale":null,"nullable":false,"default":null,"identity":"","generated":"","collation_schema":"pg_catalog","collation":"default"}`

### neon_auth.jwks.publicKey

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"jwks","position":2,"name":"publicKey","full_type":"text","type_schema":"pg_catalog","internal_type":"text","length":null,"precision":null,"scale":null,"nullable":false,"default":null,"identity":"","generated":"","collation_schema":"pg_catalog","collation":"default"}`

### neon_auth.member.createdAt

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"member","position":5,"name":"createdAt","full_type":"timestamp with time zone","type_schema":"pg_catalog","internal_type":"timestamptz","length":null,"precision":null,"scale":null,"nullable":false,"default":null,"identity":"","generated":"","collation_schema":null,"collation":null}`

### neon_auth.member.id

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"member","position":1,"name":"id","full_type":"uuid","type_schema":"pg_catalog","internal_type":"uuid","length":null,"precision":null,"scale":null,"nullable":false,"default":"gen_random_uuid()","identity":"","generated":"","collation_schema":null,"collation":null}`

### neon_auth.member.organizationId

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"member","position":2,"name":"organizationId","full_type":"uuid","type_schema":"pg_catalog","internal_type":"uuid","length":null,"precision":null,"scale":null,"nullable":false,"default":null,"identity":"","generated":"","collation_schema":null,"collation":null}`

### neon_auth.member.role

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"member","position":4,"name":"role","full_type":"text","type_schema":"pg_catalog","internal_type":"text","length":null,"precision":null,"scale":null,"nullable":false,"default":null,"identity":"","generated":"","collation_schema":"pg_catalog","collation":"default"}`

### neon_auth.member.userId

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"member","position":3,"name":"userId","full_type":"uuid","type_schema":"pg_catalog","internal_type":"uuid","length":null,"precision":null,"scale":null,"nullable":false,"default":null,"identity":"","generated":"","collation_schema":null,"collation":null}`

### neon_auth.organization.createdAt

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"organization","position":5,"name":"createdAt","full_type":"timestamp with time zone","type_schema":"pg_catalog","internal_type":"timestamptz","length":null,"precision":null,"scale":null,"nullable":false,"default":null,"identity":"","generated":"","collation_schema":null,"collation":null}`

### neon_auth.organization.id

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"organization","position":1,"name":"id","full_type":"uuid","type_schema":"pg_catalog","internal_type":"uuid","length":null,"precision":null,"scale":null,"nullable":false,"default":"gen_random_uuid()","identity":"","generated":"","collation_schema":null,"collation":null}`

### neon_auth.organization.logo

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"organization","position":4,"name":"logo","full_type":"text","type_schema":"pg_catalog","internal_type":"text","length":null,"precision":null,"scale":null,"nullable":true,"default":null,"identity":"","generated":"","collation_schema":"pg_catalog","collation":"default"}`

### neon_auth.organization.metadata

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"organization","position":6,"name":"metadata","full_type":"text","type_schema":"pg_catalog","internal_type":"text","length":null,"precision":null,"scale":null,"nullable":true,"default":null,"identity":"","generated":"","collation_schema":"pg_catalog","collation":"default"}`

### neon_auth.organization.name

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"organization","position":2,"name":"name","full_type":"text","type_schema":"pg_catalog","internal_type":"text","length":null,"precision":null,"scale":null,"nullable":false,"default":null,"identity":"","generated":"","collation_schema":"pg_catalog","collation":"default"}`

### neon_auth.organization.slug

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"organization","position":3,"name":"slug","full_type":"text","type_schema":"pg_catalog","internal_type":"text","length":null,"precision":null,"scale":null,"nullable":false,"default":null,"identity":"","generated":"","collation_schema":"pg_catalog","collation":"default"}`

### neon_auth.project_config.allow_localhost

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"project_config","position":10,"name":"allow_localhost","full_type":"boolean","type_schema":"pg_catalog","internal_type":"bool","length":null,"precision":null,"scale":null,"nullable":false,"default":null,"identity":"","generated":"","collation_schema":null,"collation":null}`

### neon_auth.project_config.created_at

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"project_config","position":4,"name":"created_at","full_type":"timestamp with time zone","type_schema":"pg_catalog","internal_type":"timestamptz","length":null,"precision":null,"scale":null,"nullable":false,"default":"CURRENT_TIMESTAMP","identity":"","generated":"","collation_schema":null,"collation":null}`

### neon_auth.project_config.email_and_password

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"project_config","position":9,"name":"email_and_password","full_type":"jsonb","type_schema":"pg_catalog","internal_type":"jsonb","length":null,"precision":null,"scale":null,"nullable":true,"default":null,"identity":"","generated":"","collation_schema":null,"collation":null}`

### neon_auth.project_config.email_provider

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"project_config","position":8,"name":"email_provider","full_type":"jsonb","type_schema":"pg_catalog","internal_type":"jsonb","length":null,"precision":null,"scale":null,"nullable":true,"default":null,"identity":"","generated":"","collation_schema":null,"collation":null}`

### neon_auth.project_config.endpoint_id

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"project_config","position":3,"name":"endpoint_id","full_type":"text","type_schema":"pg_catalog","internal_type":"text","length":null,"precision":null,"scale":null,"nullable":false,"default":null,"identity":"","generated":"","collation_schema":"pg_catalog","collation":"default"}`

### neon_auth.project_config.id

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"project_config","position":1,"name":"id","full_type":"uuid","type_schema":"pg_catalog","internal_type":"uuid","length":null,"precision":null,"scale":null,"nullable":false,"default":"gen_random_uuid()","identity":"","generated":"","collation_schema":null,"collation":null}`

### neon_auth.project_config.name

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"project_config","position":2,"name":"name","full_type":"text","type_schema":"pg_catalog","internal_type":"text","length":null,"precision":null,"scale":null,"nullable":false,"default":null,"identity":"","generated":"","collation_schema":"pg_catalog","collation":"default"}`

### neon_auth.project_config.plugin_configs

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"project_config","position":11,"name":"plugin_configs","full_type":"jsonb","type_schema":"pg_catalog","internal_type":"jsonb","length":null,"precision":null,"scale":null,"nullable":true,"default":null,"identity":"","generated":"","collation_schema":null,"collation":null}`

### neon_auth.project_config.social_providers

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"project_config","position":7,"name":"social_providers","full_type":"jsonb","type_schema":"pg_catalog","internal_type":"jsonb","length":null,"precision":null,"scale":null,"nullable":false,"default":null,"identity":"","generated":"","collation_schema":null,"collation":null}`

### neon_auth.project_config.trusted_origins

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"project_config","position":6,"name":"trusted_origins","full_type":"jsonb","type_schema":"pg_catalog","internal_type":"jsonb","length":null,"precision":null,"scale":null,"nullable":false,"default":null,"identity":"","generated":"","collation_schema":null,"collation":null}`

### neon_auth.project_config.updated_at

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"project_config","position":5,"name":"updated_at","full_type":"timestamp with time zone","type_schema":"pg_catalog","internal_type":"timestamptz","length":null,"precision":null,"scale":null,"nullable":false,"default":"CURRENT_TIMESTAMP","identity":"","generated":"","collation_schema":null,"collation":null}`

### neon_auth.project_config.webhook_config

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"project_config","position":12,"name":"webhook_config","full_type":"jsonb","type_schema":"pg_catalog","internal_type":"jsonb","length":null,"precision":null,"scale":null,"nullable":true,"default":null,"identity":"","generated":"","collation_schema":null,"collation":null}`

### neon_auth.session.activeOrganizationId

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"session","position":10,"name":"activeOrganizationId","full_type":"text","type_schema":"pg_catalog","internal_type":"text","length":null,"precision":null,"scale":null,"nullable":true,"default":null,"identity":"","generated":"","collation_schema":"pg_catalog","collation":"default"}`

### neon_auth.session.createdAt

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"session","position":4,"name":"createdAt","full_type":"timestamp with time zone","type_schema":"pg_catalog","internal_type":"timestamptz","length":null,"precision":null,"scale":null,"nullable":false,"default":"CURRENT_TIMESTAMP","identity":"","generated":"","collation_schema":null,"collation":null}`

### neon_auth.session.expiresAt

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"session","position":2,"name":"expiresAt","full_type":"timestamp with time zone","type_schema":"pg_catalog","internal_type":"timestamptz","length":null,"precision":null,"scale":null,"nullable":false,"default":null,"identity":"","generated":"","collation_schema":null,"collation":null}`

### neon_auth.session.id

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"session","position":1,"name":"id","full_type":"uuid","type_schema":"pg_catalog","internal_type":"uuid","length":null,"precision":null,"scale":null,"nullable":false,"default":"gen_random_uuid()","identity":"","generated":"","collation_schema":null,"collation":null}`

### neon_auth.session.impersonatedBy

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"session","position":9,"name":"impersonatedBy","full_type":"text","type_schema":"pg_catalog","internal_type":"text","length":null,"precision":null,"scale":null,"nullable":true,"default":null,"identity":"","generated":"","collation_schema":"pg_catalog","collation":"default"}`

### neon_auth.session.ipAddress

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"session","position":6,"name":"ipAddress","full_type":"text","type_schema":"pg_catalog","internal_type":"text","length":null,"precision":null,"scale":null,"nullable":true,"default":null,"identity":"","generated":"","collation_schema":"pg_catalog","collation":"default"}`

### neon_auth.session.token

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"session","position":3,"name":"token","full_type":"text","type_schema":"pg_catalog","internal_type":"text","length":null,"precision":null,"scale":null,"nullable":false,"default":null,"identity":"","generated":"","collation_schema":"pg_catalog","collation":"default"}`

### neon_auth.session.updatedAt

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"session","position":5,"name":"updatedAt","full_type":"timestamp with time zone","type_schema":"pg_catalog","internal_type":"timestamptz","length":null,"precision":null,"scale":null,"nullable":false,"default":null,"identity":"","generated":"","collation_schema":null,"collation":null}`

### neon_auth.session.userAgent

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"session","position":7,"name":"userAgent","full_type":"text","type_schema":"pg_catalog","internal_type":"text","length":null,"precision":null,"scale":null,"nullable":true,"default":null,"identity":"","generated":"","collation_schema":"pg_catalog","collation":"default"}`

### neon_auth.session.userId

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"session","position":8,"name":"userId","full_type":"uuid","type_schema":"pg_catalog","internal_type":"uuid","length":null,"precision":null,"scale":null,"nullable":false,"default":null,"identity":"","generated":"","collation_schema":null,"collation":null}`

### neon_auth.user.banExpires

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"user","position":11,"name":"banExpires","full_type":"timestamp with time zone","type_schema":"pg_catalog","internal_type":"timestamptz","length":null,"precision":null,"scale":null,"nullable":true,"default":null,"identity":"","generated":"","collation_schema":null,"collation":null}`

### neon_auth.user.banReason

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"user","position":10,"name":"banReason","full_type":"text","type_schema":"pg_catalog","internal_type":"text","length":null,"precision":null,"scale":null,"nullable":true,"default":null,"identity":"","generated":"","collation_schema":"pg_catalog","collation":"default"}`

### neon_auth.user.banned

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"user","position":9,"name":"banned","full_type":"boolean","type_schema":"pg_catalog","internal_type":"bool","length":null,"precision":null,"scale":null,"nullable":true,"default":null,"identity":"","generated":"","collation_schema":null,"collation":null}`

### neon_auth.user.createdAt

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"user","position":6,"name":"createdAt","full_type":"timestamp with time zone","type_schema":"pg_catalog","internal_type":"timestamptz","length":null,"precision":null,"scale":null,"nullable":false,"default":"CURRENT_TIMESTAMP","identity":"","generated":"","collation_schema":null,"collation":null}`

### neon_auth.user.email

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"user","position":3,"name":"email","full_type":"text","type_schema":"pg_catalog","internal_type":"text","length":null,"precision":null,"scale":null,"nullable":false,"default":null,"identity":"","generated":"","collation_schema":"pg_catalog","collation":"default"}`

### neon_auth.user.emailVerified

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"user","position":4,"name":"emailVerified","full_type":"boolean","type_schema":"pg_catalog","internal_type":"bool","length":null,"precision":null,"scale":null,"nullable":false,"default":null,"identity":"","generated":"","collation_schema":null,"collation":null}`

### neon_auth.user.id

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"user","position":1,"name":"id","full_type":"uuid","type_schema":"pg_catalog","internal_type":"uuid","length":null,"precision":null,"scale":null,"nullable":false,"default":"gen_random_uuid()","identity":"","generated":"","collation_schema":null,"collation":null}`

### neon_auth.user.image

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"user","position":5,"name":"image","full_type":"text","type_schema":"pg_catalog","internal_type":"text","length":null,"precision":null,"scale":null,"nullable":true,"default":null,"identity":"","generated":"","collation_schema":"pg_catalog","collation":"default"}`

### neon_auth.user.name

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"user","position":2,"name":"name","full_type":"text","type_schema":"pg_catalog","internal_type":"text","length":null,"precision":null,"scale":null,"nullable":false,"default":null,"identity":"","generated":"","collation_schema":"pg_catalog","collation":"default"}`

### neon_auth.user.role

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"user","position":8,"name":"role","full_type":"text","type_schema":"pg_catalog","internal_type":"text","length":null,"precision":null,"scale":null,"nullable":true,"default":null,"identity":"","generated":"","collation_schema":"pg_catalog","collation":"default"}`

### neon_auth.user.updatedAt

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"user","position":7,"name":"updatedAt","full_type":"timestamp with time zone","type_schema":"pg_catalog","internal_type":"timestamptz","length":null,"precision":null,"scale":null,"nullable":false,"default":"CURRENT_TIMESTAMP","identity":"","generated":"","collation_schema":null,"collation":null}`

### neon_auth.verification.createdAt

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"verification","position":5,"name":"createdAt","full_type":"timestamp with time zone","type_schema":"pg_catalog","internal_type":"timestamptz","length":null,"precision":null,"scale":null,"nullable":false,"default":"CURRENT_TIMESTAMP","identity":"","generated":"","collation_schema":null,"collation":null}`

### neon_auth.verification.expiresAt

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"verification","position":4,"name":"expiresAt","full_type":"timestamp with time zone","type_schema":"pg_catalog","internal_type":"timestamptz","length":null,"precision":null,"scale":null,"nullable":false,"default":null,"identity":"","generated":"","collation_schema":null,"collation":null}`

### neon_auth.verification.id

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"verification","position":1,"name":"id","full_type":"uuid","type_schema":"pg_catalog","internal_type":"uuid","length":null,"precision":null,"scale":null,"nullable":false,"default":"gen_random_uuid()","identity":"","generated":"","collation_schema":null,"collation":null}`

### neon_auth.verification.identifier

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"verification","position":2,"name":"identifier","full_type":"text","type_schema":"pg_catalog","internal_type":"text","length":null,"precision":null,"scale":null,"nullable":false,"default":null,"identity":"","generated":"","collation_schema":"pg_catalog","collation":"default"}`

### neon_auth.verification.updatedAt

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"verification","position":6,"name":"updatedAt","full_type":"timestamp with time zone","type_schema":"pg_catalog","internal_type":"timestamptz","length":null,"precision":null,"scale":null,"nullable":false,"default":"CURRENT_TIMESTAMP","identity":"","generated":"","collation_schema":null,"collation":null}`

### neon_auth.verification.value

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"verification","position":3,"name":"value","full_type":"text","type_schema":"pg_catalog","internal_type":"text","length":null,"precision":null,"scale":null,"nullable":false,"default":null,"identity":"","generated":"","collation_schema":"pg_catalog","collation":"default"}`

### neon_auth.account.account_pkey

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"account","name":"account_pkey","unique":true,"primary":true,"method":"btree","keys":["id"],"columns":"{id}","include":[],"expressions":null,"operator_classes":"{uuid_ops}","options":"0","predicate":null,"definition":"CREATE UNIQUE INDEX account_pkey ON neon_auth.account USING btree (id)"}`

### neon_auth.account.account_userId_idx

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"account","name":"account_userId_idx","unique":false,"primary":false,"method":"btree","keys":["\"userId\""],"columns":"{userId}","include":[],"expressions":null,"operator_classes":"{uuid_ops}","options":"0","predicate":null,"definition":"CREATE INDEX \"account_userId_idx\" ON neon_auth.account USING btree (\"userId\")"}`

### neon_auth.invitation.invitation_email_idx

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"invitation","name":"invitation_email_idx","unique":false,"primary":false,"method":"btree","keys":["email"],"columns":"{email}","include":[],"expressions":null,"operator_classes":"{text_ops}","options":"0","predicate":null,"definition":"CREATE INDEX invitation_email_idx ON neon_auth.invitation USING btree (email)"}`

### neon_auth.invitation.invitation_organizationId_idx

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"invitation","name":"invitation_organizationId_idx","unique":false,"primary":false,"method":"btree","keys":["\"organizationId\""],"columns":"{organizationId}","include":[],"expressions":null,"operator_classes":"{uuid_ops}","options":"0","predicate":null,"definition":"CREATE INDEX \"invitation_organizationId_idx\" ON neon_auth.invitation USING btree (\"organizationId\")"}`

### neon_auth.invitation.invitation_pkey

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"invitation","name":"invitation_pkey","unique":true,"primary":true,"method":"btree","keys":["id"],"columns":"{id}","include":[],"expressions":null,"operator_classes":"{uuid_ops}","options":"0","predicate":null,"definition":"CREATE UNIQUE INDEX invitation_pkey ON neon_auth.invitation USING btree (id)"}`

### neon_auth.jwks.jwks_pkey

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"jwks","name":"jwks_pkey","unique":true,"primary":true,"method":"btree","keys":["id"],"columns":"{id}","include":[],"expressions":null,"operator_classes":"{uuid_ops}","options":"0","predicate":null,"definition":"CREATE UNIQUE INDEX jwks_pkey ON neon_auth.jwks USING btree (id)"}`

### neon_auth.member.member_organizationId_idx

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"member","name":"member_organizationId_idx","unique":false,"primary":false,"method":"btree","keys":["\"organizationId\""],"columns":"{organizationId}","include":[],"expressions":null,"operator_classes":"{uuid_ops}","options":"0","predicate":null,"definition":"CREATE INDEX \"member_organizationId_idx\" ON neon_auth.member USING btree (\"organizationId\")"}`

### neon_auth.member.member_pkey

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"member","name":"member_pkey","unique":true,"primary":true,"method":"btree","keys":["id"],"columns":"{id}","include":[],"expressions":null,"operator_classes":"{uuid_ops}","options":"0","predicate":null,"definition":"CREATE UNIQUE INDEX member_pkey ON neon_auth.member USING btree (id)"}`

### neon_auth.member.member_userId_idx

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"member","name":"member_userId_idx","unique":false,"primary":false,"method":"btree","keys":["\"userId\""],"columns":"{userId}","include":[],"expressions":null,"operator_classes":"{uuid_ops}","options":"0","predicate":null,"definition":"CREATE INDEX \"member_userId_idx\" ON neon_auth.member USING btree (\"userId\")"}`

### neon_auth.organization.organization_pkey

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"organization","name":"organization_pkey","unique":true,"primary":true,"method":"btree","keys":["id"],"columns":"{id}","include":[],"expressions":null,"operator_classes":"{uuid_ops}","options":"0","predicate":null,"definition":"CREATE UNIQUE INDEX organization_pkey ON neon_auth.organization USING btree (id)"}`

### neon_auth.organization.organization_slug_key

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"organization","name":"organization_slug_key","unique":true,"primary":false,"method":"btree","keys":["slug"],"columns":"{slug}","include":[],"expressions":null,"operator_classes":"{text_ops}","options":"0","predicate":null,"definition":"CREATE UNIQUE INDEX organization_slug_key ON neon_auth.organization USING btree (slug)"}`

### neon_auth.organization.organization_slug_uidx

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"organization","name":"organization_slug_uidx","unique":true,"primary":false,"method":"btree","keys":["slug"],"columns":"{slug}","include":[],"expressions":null,"operator_classes":"{text_ops}","options":"0","predicate":null,"definition":"CREATE UNIQUE INDEX organization_slug_uidx ON neon_auth.organization USING btree (slug)"}`

### neon_auth.project_config.project_config_endpoint_id_key

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"project_config","name":"project_config_endpoint_id_key","unique":true,"primary":false,"method":"btree","keys":["endpoint_id"],"columns":"{endpoint_id}","include":[],"expressions":null,"operator_classes":"{text_ops}","options":"0","predicate":null,"definition":"CREATE UNIQUE INDEX project_config_endpoint_id_key ON neon_auth.project_config USING btree (endpoint_id)"}`

### neon_auth.project_config.project_config_pkey

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"project_config","name":"project_config_pkey","unique":true,"primary":true,"method":"btree","keys":["id"],"columns":"{id}","include":[],"expressions":null,"operator_classes":"{uuid_ops}","options":"0","predicate":null,"definition":"CREATE UNIQUE INDEX project_config_pkey ON neon_auth.project_config USING btree (id)"}`

### neon_auth.session.session_pkey

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"session","name":"session_pkey","unique":true,"primary":true,"method":"btree","keys":["id"],"columns":"{id}","include":[],"expressions":null,"operator_classes":"{uuid_ops}","options":"0","predicate":null,"definition":"CREATE UNIQUE INDEX session_pkey ON neon_auth.session USING btree (id)"}`

### neon_auth.session.session_token_key

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"session","name":"session_token_key","unique":true,"primary":false,"method":"btree","keys":["token"],"columns":"{token}","include":[],"expressions":null,"operator_classes":"{text_ops}","options":"0","predicate":null,"definition":"CREATE UNIQUE INDEX session_token_key ON neon_auth.session USING btree (token)"}`

### neon_auth.session.session_userId_idx

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"session","name":"session_userId_idx","unique":false,"primary":false,"method":"btree","keys":["\"userId\""],"columns":"{userId}","include":[],"expressions":null,"operator_classes":"{uuid_ops}","options":"0","predicate":null,"definition":"CREATE INDEX \"session_userId_idx\" ON neon_auth.session USING btree (\"userId\")"}`

### neon_auth.user.user_email_key

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"user","name":"user_email_key","unique":true,"primary":false,"method":"btree","keys":["email"],"columns":"{email}","include":[],"expressions":null,"operator_classes":"{text_ops}","options":"0","predicate":null,"definition":"CREATE UNIQUE INDEX user_email_key ON neon_auth.\"user\" USING btree (email)"}`

### neon_auth.user.user_pkey

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"user","name":"user_pkey","unique":true,"primary":true,"method":"btree","keys":["id"],"columns":"{id}","include":[],"expressions":null,"operator_classes":"{uuid_ops}","options":"0","predicate":null,"definition":"CREATE UNIQUE INDEX user_pkey ON neon_auth.\"user\" USING btree (id)"}`

### neon_auth.verification.verification_identifier_idx

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"verification","name":"verification_identifier_idx","unique":false,"primary":false,"method":"btree","keys":["identifier"],"columns":"{identifier}","include":[],"expressions":null,"operator_classes":"{text_ops}","options":"0","predicate":null,"definition":"CREATE INDEX verification_identifier_idx ON neon_auth.verification USING btree (identifier)"}`

### neon_auth.verification.verification_pkey

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"verification","name":"verification_pkey","unique":true,"primary":true,"method":"btree","keys":["id"],"columns":"{id}","include":[],"expressions":null,"operator_classes":"{uuid_ops}","options":"0","predicate":null,"definition":"CREATE UNIQUE INDEX verification_pkey ON neon_auth.verification USING btree (id)"}`

### neon_auth.account.account_pkey

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"account","name":"account_pkey","type":"PRIMARY_KEY","definition":"PRIMARY KEY (id)","columns":"{id}","referenced_schema":null,"referenced_table":null,"referenced_columns":"{}","on_delete":null,"on_update":null,"deferrable":false,"initially_deferred":false,"validated":true}`

### neon_auth.account.account_userId_fkey

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"account","name":"account_userId_fkey","type":"FOREIGN_KEY","definition":"FOREIGN KEY (\"userId\") REFERENCES neon_auth.\"user\"(id) ON DELETE CASCADE","columns":"{userId}","referenced_schema":"neon_auth","referenced_table":"user","referenced_columns":"{id}","on_delete":"CASCADE","on_update":"NO ACTION","deferrable":false,"initially_deferred":false,"validated":true}`

### neon_auth.invitation.invitation_inviterId_fkey

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"invitation","name":"invitation_inviterId_fkey","type":"FOREIGN_KEY","definition":"FOREIGN KEY (\"inviterId\") REFERENCES neon_auth.\"user\"(id) ON DELETE CASCADE","columns":"{inviterId}","referenced_schema":"neon_auth","referenced_table":"user","referenced_columns":"{id}","on_delete":"CASCADE","on_update":"NO ACTION","deferrable":false,"initially_deferred":false,"validated":true}`

### neon_auth.invitation.invitation_organizationId_fkey

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"invitation","name":"invitation_organizationId_fkey","type":"FOREIGN_KEY","definition":"FOREIGN KEY (\"organizationId\") REFERENCES neon_auth.organization(id) ON DELETE CASCADE","columns":"{organizationId}","referenced_schema":"neon_auth","referenced_table":"organization","referenced_columns":"{id}","on_delete":"CASCADE","on_update":"NO ACTION","deferrable":false,"initially_deferred":false,"validated":true}`

### neon_auth.invitation.invitation_pkey

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"invitation","name":"invitation_pkey","type":"PRIMARY_KEY","definition":"PRIMARY KEY (id)","columns":"{id}","referenced_schema":null,"referenced_table":null,"referenced_columns":"{}","on_delete":null,"on_update":null,"deferrable":false,"initially_deferred":false,"validated":true}`

### neon_auth.jwks.jwks_pkey

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"jwks","name":"jwks_pkey","type":"PRIMARY_KEY","definition":"PRIMARY KEY (id)","columns":"{id}","referenced_schema":null,"referenced_table":null,"referenced_columns":"{}","on_delete":null,"on_update":null,"deferrable":false,"initially_deferred":false,"validated":true}`

### neon_auth.member.member_organizationId_fkey

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"member","name":"member_organizationId_fkey","type":"FOREIGN_KEY","definition":"FOREIGN KEY (\"organizationId\") REFERENCES neon_auth.organization(id) ON DELETE CASCADE","columns":"{organizationId}","referenced_schema":"neon_auth","referenced_table":"organization","referenced_columns":"{id}","on_delete":"CASCADE","on_update":"NO ACTION","deferrable":false,"initially_deferred":false,"validated":true}`

### neon_auth.member.member_pkey

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"member","name":"member_pkey","type":"PRIMARY_KEY","definition":"PRIMARY KEY (id)","columns":"{id}","referenced_schema":null,"referenced_table":null,"referenced_columns":"{}","on_delete":null,"on_update":null,"deferrable":false,"initially_deferred":false,"validated":true}`

### neon_auth.member.member_userId_fkey

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"member","name":"member_userId_fkey","type":"FOREIGN_KEY","definition":"FOREIGN KEY (\"userId\") REFERENCES neon_auth.\"user\"(id) ON DELETE CASCADE","columns":"{userId}","referenced_schema":"neon_auth","referenced_table":"user","referenced_columns":"{id}","on_delete":"CASCADE","on_update":"NO ACTION","deferrable":false,"initially_deferred":false,"validated":true}`

### neon_auth.organization.organization_pkey

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"organization","name":"organization_pkey","type":"PRIMARY_KEY","definition":"PRIMARY KEY (id)","columns":"{id}","referenced_schema":null,"referenced_table":null,"referenced_columns":"{}","on_delete":null,"on_update":null,"deferrable":false,"initially_deferred":false,"validated":true}`

### neon_auth.organization.organization_slug_key

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"organization","name":"organization_slug_key","type":"UNIQUE","definition":"UNIQUE (slug)","columns":"{slug}","referenced_schema":null,"referenced_table":null,"referenced_columns":"{}","on_delete":null,"on_update":null,"deferrable":false,"initially_deferred":false,"validated":true}`

### neon_auth.project_config.project_config_endpoint_id_key

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"project_config","name":"project_config_endpoint_id_key","type":"UNIQUE","definition":"UNIQUE (endpoint_id)","columns":"{endpoint_id}","referenced_schema":null,"referenced_table":null,"referenced_columns":"{}","on_delete":null,"on_update":null,"deferrable":false,"initially_deferred":false,"validated":true}`

### neon_auth.project_config.project_config_pkey

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"project_config","name":"project_config_pkey","type":"PRIMARY_KEY","definition":"PRIMARY KEY (id)","columns":"{id}","referenced_schema":null,"referenced_table":null,"referenced_columns":"{}","on_delete":null,"on_update":null,"deferrable":false,"initially_deferred":false,"validated":true}`

### neon_auth.session.session_pkey

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"session","name":"session_pkey","type":"PRIMARY_KEY","definition":"PRIMARY KEY (id)","columns":"{id}","referenced_schema":null,"referenced_table":null,"referenced_columns":"{}","on_delete":null,"on_update":null,"deferrable":false,"initially_deferred":false,"validated":true}`

### neon_auth.session.session_token_key

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"session","name":"session_token_key","type":"UNIQUE","definition":"UNIQUE (token)","columns":"{token}","referenced_schema":null,"referenced_table":null,"referenced_columns":"{}","on_delete":null,"on_update":null,"deferrable":false,"initially_deferred":false,"validated":true}`

### neon_auth.session.session_userId_fkey

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"session","name":"session_userId_fkey","type":"FOREIGN_KEY","definition":"FOREIGN KEY (\"userId\") REFERENCES neon_auth.\"user\"(id) ON DELETE CASCADE","columns":"{userId}","referenced_schema":"neon_auth","referenced_table":"user","referenced_columns":"{id}","on_delete":"CASCADE","on_update":"NO ACTION","deferrable":false,"initially_deferred":false,"validated":true}`

### neon_auth.user.user_email_key

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"user","name":"user_email_key","type":"UNIQUE","definition":"UNIQUE (email)","columns":"{email}","referenced_schema":null,"referenced_table":null,"referenced_columns":"{}","on_delete":null,"on_update":null,"deferrable":false,"initially_deferred":false,"validated":true}`

### neon_auth.user.user_pkey

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"user","name":"user_pkey","type":"PRIMARY_KEY","definition":"PRIMARY KEY (id)","columns":"{id}","referenced_schema":null,"referenced_table":null,"referenced_columns":"{}","on_delete":null,"on_update":null,"deferrable":false,"initially_deferred":false,"validated":true}`

### neon_auth.verification.verification_pkey

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"neon_auth","table":"verification","name":"verification_pkey","type":"PRIMARY_KEY","definition":"PRIMARY KEY (id)","columns":"{id}","referenced_schema":null,"referenced_table":null,"referenced_columns":"{}","on_delete":null,"on_update":null,"deferrable":false,"initially_deferred":false,"validated":true}`

### pg_session_jwt

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"name":"pg_session_jwt","version":"0.4.0","schema":"public"}`

### auth.init..function

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"auth","name":"init","identity_arguments":"","kind":"function","language":"c","volatility":"v","security_definer":false,"result":"void","definition":"CREATE OR REPLACE FUNCTION auth.init() RETURNS void LANGUAGE c STRICT AS '$libdir/pg_session_jwt', $function$init_wrapper$function$"}`

### auth.jwt..function

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"auth","name":"jwt","identity_arguments":"","kind":"function","language":"c","volatility":"s","security_definer":false,"result":"jsonb","definition":"CREATE OR REPLACE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE c STABLE PARALLEL SAFE STRICT AS '$libdir/pg_session_jwt', $function$jwt_wrapper$function$"}`

### auth.jwt_session_init.jwt text.function

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"auth","name":"jwt_session_init","identity_arguments":"jwt text","kind":"function","language":"c","volatility":"v","security_definer":false,"result":"void","definition":"CREATE OR REPLACE FUNCTION auth.jwt_session_init(jwt text) RETURNS void LANGUAGE c STRICT AS '$libdir/pg_session_jwt', $function$jwt_session_init_wrapper$function$"}`

### auth.session..function

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"auth","name":"session","identity_arguments":"","kind":"function","language":"c","volatility":"s","security_definer":false,"result":"jsonb","definition":"CREATE OR REPLACE FUNCTION auth.session() RETURNS jsonb LANGUAGE c STABLE PARALLEL SAFE STRICT AS '$libdir/pg_session_jwt', $function$session_wrapper$function$"}`

### auth.uid..function

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"auth","name":"uid","identity_arguments":"","kind":"function","language":"c","volatility":"s","security_definer":false,"result":"uuid","definition":"CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE c STABLE PARALLEL SAFE STRICT AS '$libdir/pg_session_jwt', $function$uid_wrapper$function$"}`

### auth.user_id..function

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"auth","name":"user_id","identity_arguments":"","kind":"function","language":"c","volatility":"s","security_definer":false,"result":"text","definition":"CREATE OR REPLACE FUNCTION auth.user_id() RETURNS text LANGUAGE c STABLE PARALLEL SAFE STRICT AS '$libdir/pg_session_jwt', $function$user_id_wrapper$function$"}`

### pgrst.pre_config..function

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"pgrst","name":"pre_config","identity_arguments":"","kind":"function","language":"sql","volatility":"v","security_definer":false,"result":"void","definition":"CREATE OR REPLACE FUNCTION pgrst.pre_config() RETURNS void LANGUAGE sql SET search_path TO '' AS $function$ SELECT set_config('pgrst.db_schemas', 'public', true) , set_config('pgrst.db_aggregates_enabled', 'true', true) , set_config('pgrst.db_anon_role', 'anonymous', true) , set_config('pgrst.jwt_role_claim_key', '.role', true) $function$"}`
