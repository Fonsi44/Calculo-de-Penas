# Divergencia de esquema de producción — PR #20

Documento generado por `tools/db/schema-inventory.mjs`. No autoriza cambios en producción.

- Fingerprint canónico: `06d448482d390bbb7dada5afea83d9b59fe9de02221365a49bdb4dd6a0d4a88c`
- Fingerprint clon: `6550201559ce9afad429a499a81901108c74d9579adf659b9b0ff0ded8201de7`
- Objetos divergentes: 216

## Resumen

| Tipo | Idénticos | Solo clon | Solo canónica | Definición diferente |
|---|---:|---:|---:|---:|
| tables | 137 | 9 | 0 | 0 |
| columns | 1577 | 76 | 0 | 42 |
| indexes | 474 | 21 | 0 | 0 |
| constraints | 411 | 22 | 0 | 0 |
| enums | 23 | 0 | 0 | 1 |
| domains | 0 | 0 | 0 | 0 |
| compositeTypes | 0 | 0 | 0 | 0 |
| sequences | 3 | 0 | 0 | 0 |
| extensions | 4 | 1 | 1 | 0 |
| routines | 151 | 7 | 36 | 0 |
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

### public.blog_posts.ai_official_sources_count

Clasificación: `SAME_NAME_DIFFERENT_DEFINITION`

- Canónica: `{"schema":"public","table":"blog_posts","position":32,"name":"ai_official_sources_count","full_type":"integer","type_schema":"pg_catalog","internal_type":"int4","length":null,"precision":32,"scale":0,"nullable":true,"default":"0","identity":"","generated":"","collation_schema":null,"collation":null}`
- Clon: `{"schema":"public","table":"blog_posts","position":42,"name":"ai_official_sources_count","full_type":"integer","type_schema":"pg_catalog","internal_type":"int4","length":null,"precision":32,"scale":0,"nullable":true,"default":"0","identity":"","generated":"","collation_schema":null,"collation":null}`

### public.blog_posts.ai_research_provider

Clasificación: `SAME_NAME_DIFFERENT_DEFINITION`

- Canónica: `{"schema":"public","table":"blog_posts","position":30,"name":"ai_research_provider","full_type":"character varying(100)","type_schema":"pg_catalog","internal_type":"varchar","length":100,"precision":null,"scale":null,"nullable":true,"default":null,"identity":"","generated":"","collation_schema":"pg_catalog","collation":"default"}`
- Clon: `{"schema":"public","table":"blog_posts","position":40,"name":"ai_research_provider","full_type":"character varying(100)","type_schema":"pg_catalog","internal_type":"varchar","length":100,"precision":null,"scale":null,"nullable":true,"default":null,"identity":"","generated":"","collation_schema":"pg_catalog","collation":"default"}`

### public.blog_posts.ai_review_claims_count

Clasificación: `SAME_NAME_DIFFERENT_DEFINITION`

- Canónica: `{"schema":"public","table":"blog_posts","position":39,"name":"ai_review_claims_count","full_type":"integer","type_schema":"pg_catalog","internal_type":"int4","length":null,"precision":32,"scale":0,"nullable":true,"default":"0","identity":"","generated":"","collation_schema":null,"collation":null}`
- Clon: `{"schema":"public","table":"blog_posts","position":34,"name":"ai_review_claims_count","full_type":"integer","type_schema":"pg_catalog","internal_type":"int4","length":null,"precision":32,"scale":0,"nullable":true,"default":"0","identity":"","generated":"","collation_schema":null,"collation":null}`

### public.blog_posts.ai_review_confidence

Clasificación: `SAME_NAME_DIFFERENT_DEFINITION`

- Canónica: `{"schema":"public","table":"blog_posts","position":37,"name":"ai_review_confidence","full_type":"character varying(50)","type_schema":"pg_catalog","internal_type":"varchar","length":50,"precision":null,"scale":null,"nullable":true,"default":null,"identity":"","generated":"","collation_schema":"pg_catalog","collation":"default"}`
- Clon: `{"schema":"public","table":"blog_posts","position":32,"name":"ai_review_confidence","full_type":"character varying(50)","type_schema":"pg_catalog","internal_type":"varchar","length":50,"precision":null,"scale":null,"nullable":true,"default":null,"identity":"","generated":"","collation_schema":"pg_catalog","collation":"default"}`

### public.blog_posts.ai_review_confirmed_claims

Clasificación: `SAME_NAME_DIFFERENT_DEFINITION`

- Canónica: `{"schema":"public","table":"blog_posts","position":40,"name":"ai_review_confirmed_claims","full_type":"integer","type_schema":"pg_catalog","internal_type":"int4","length":null,"precision":32,"scale":0,"nullable":true,"default":"0","identity":"","generated":"","collation_schema":null,"collation":null}`
- Clon: `{"schema":"public","table":"blog_posts","position":35,"name":"ai_review_confirmed_claims","full_type":"integer","type_schema":"pg_catalog","internal_type":"int4","length":null,"precision":32,"scale":0,"nullable":true,"default":"0","identity":"","generated":"","collation_schema":null,"collation":null}`

### public.blog_posts.ai_review_corrected_claims

Clasificación: `SAME_NAME_DIFFERENT_DEFINITION`

- Canónica: `{"schema":"public","table":"blog_posts","position":41,"name":"ai_review_corrected_claims","full_type":"integer","type_schema":"pg_catalog","internal_type":"int4","length":null,"precision":32,"scale":0,"nullable":true,"default":"0","identity":"","generated":"","collation_schema":null,"collation":null}`
- Clon: `{"schema":"public","table":"blog_posts","position":36,"name":"ai_review_corrected_claims","full_type":"integer","type_schema":"pg_catalog","internal_type":"int4","length":null,"precision":32,"scale":0,"nullable":true,"default":"0","identity":"","generated":"","collation_schema":null,"collation":null}`

### public.blog_posts.ai_review_model

Clasificación: `SAME_NAME_DIFFERENT_DEFINITION`

- Canónica: `{"schema":"public","table":"blog_posts","position":35,"name":"ai_review_model","full_type":"character varying(100)","type_schema":"pg_catalog","internal_type":"varchar","length":100,"precision":null,"scale":null,"nullable":true,"default":null,"identity":"","generated":"","collation_schema":"pg_catalog","collation":"default"}`
- Clon: `{"schema":"public","table":"blog_posts","position":30,"name":"ai_review_model","full_type":"character varying(100)","type_schema":"pg_catalog","internal_type":"varchar","length":100,"precision":null,"scale":null,"nullable":true,"default":null,"identity":"","generated":"","collation_schema":"pg_catalog","collation":"default"}`

### public.blog_posts.ai_review_provider

Clasificación: `SAME_NAME_DIFFERENT_DEFINITION`

- Canónica: `{"schema":"public","table":"blog_posts","position":28,"name":"ai_review_provider","full_type":"character varying(100)","type_schema":"pg_catalog","internal_type":"varchar","length":100,"precision":null,"scale":null,"nullable":true,"default":null,"identity":"","generated":"","collation_schema":"pg_catalog","collation":"default"}`
- Clon: `{"schema":"public","table":"blog_posts","position":38,"name":"ai_review_provider","full_type":"character varying(100)","type_schema":"pg_catalog","internal_type":"varchar","length":100,"precision":null,"scale":null,"nullable":true,"default":null,"identity":"","generated":"","collation_schema":"pg_catalog","collation":"default"}`

### public.blog_posts.ai_review_requires_human

Clasificación: `SAME_NAME_DIFFERENT_DEFINITION`

- Canónica: `{"schema":"public","table":"blog_posts","position":29,"name":"ai_review_requires_human","full_type":"boolean","type_schema":"pg_catalog","internal_type":"bool","length":null,"precision":null,"scale":null,"nullable":true,"default":"false","identity":"","generated":"","collation_schema":null,"collation":null}`
- Clon: `{"schema":"public","table":"blog_posts","position":39,"name":"ai_review_requires_human","full_type":"boolean","type_schema":"pg_catalog","internal_type":"bool","length":null,"precision":null,"scale":null,"nullable":true,"default":"false","identity":"","generated":"","collation_schema":null,"collation":null}`

### public.blog_posts.ai_review_sources

Clasificación: `SAME_NAME_DIFFERENT_DEFINITION`

- Canónica: `{"schema":"public","table":"blog_posts","position":38,"name":"ai_review_sources","full_type":"jsonb","type_schema":"pg_catalog","internal_type":"jsonb","length":null,"precision":null,"scale":null,"nullable":true,"default":"'[]'::jsonb","identity":"","generated":"","collation_schema":null,"collation":null}`
- Clon: `{"schema":"public","table":"blog_posts","position":33,"name":"ai_review_sources","full_type":"jsonb","type_schema":"pg_catalog","internal_type":"jsonb","length":null,"precision":null,"scale":null,"nullable":true,"default":"'[]'::jsonb","identity":"","generated":"","collation_schema":null,"collation":null}`

### public.blog_posts.ai_review_status

Clasificación: `SAME_NAME_DIFFERENT_DEFINITION`

- Canónica: `{"schema":"public","table":"blog_posts","position":33,"name":"ai_review_status","full_type":"character varying(50)","type_schema":"pg_catalog","internal_type":"varchar","length":50,"precision":null,"scale":null,"nullable":true,"default":"'not_started'::character varying","identity":"","generated":"","collation_schema":"pg_catalog","collation":"default"}`
- Clon: `{"schema":"public","table":"blog_posts","position":28,"name":"ai_review_status","full_type":"character varying(50)","type_schema":"pg_catalog","internal_type":"varchar","length":50,"precision":null,"scale":null,"nullable":true,"default":"'not_started'::character varying","identity":"","generated":"","collation_schema":"pg_catalog","collation":"default"}`

### public.blog_posts.ai_review_unresolved_claims

Clasificación: `SAME_NAME_DIFFERENT_DEFINITION`

- Canónica: `{"schema":"public","table":"blog_posts","position":42,"name":"ai_review_unresolved_claims","full_type":"integer","type_schema":"pg_catalog","internal_type":"int4","length":null,"precision":32,"scale":0,"nullable":true,"default":"0","identity":"","generated":"","collation_schema":null,"collation":null}`
- Clon: `{"schema":"public","table":"blog_posts","position":37,"name":"ai_review_unresolved_claims","full_type":"integer","type_schema":"pg_catalog","internal_type":"int4","length":null,"precision":32,"scale":0,"nullable":true,"default":"0","identity":"","generated":"","collation_schema":null,"collation":null}`

### public.blog_posts.ai_review_version

Clasificación: `SAME_NAME_DIFFERENT_DEFINITION`

- Canónica: `{"schema":"public","table":"blog_posts","position":36,"name":"ai_review_version","full_type":"character varying(100)","type_schema":"pg_catalog","internal_type":"varchar","length":100,"precision":null,"scale":null,"nullable":true,"default":null,"identity":"","generated":"","collation_schema":"pg_catalog","collation":"default"}`
- Clon: `{"schema":"public","table":"blog_posts","position":31,"name":"ai_review_version","full_type":"character varying(100)","type_schema":"pg_catalog","internal_type":"varchar","length":100,"precision":null,"scale":null,"nullable":true,"default":null,"identity":"","generated":"","collation_schema":"pg_catalog","collation":"default"}`

### public.blog_posts.ai_reviewed_at

Clasificación: `SAME_NAME_DIFFERENT_DEFINITION`

- Canónica: `{"schema":"public","table":"blog_posts","position":34,"name":"ai_reviewed_at","full_type":"timestamp with time zone","type_schema":"pg_catalog","internal_type":"timestamptz","length":null,"precision":null,"scale":null,"nullable":true,"default":null,"identity":"","generated":"","collation_schema":null,"collation":null}`
- Clon: `{"schema":"public","table":"blog_posts","position":29,"name":"ai_reviewed_at","full_type":"timestamp with time zone","type_schema":"pg_catalog","internal_type":"timestamptz","length":null,"precision":null,"scale":null,"nullable":true,"default":null,"identity":"","generated":"","collation_schema":null,"collation":null}`

### public.blog_posts.ai_search_queries_count

Clasificación: `SAME_NAME_DIFFERENT_DEFINITION`

- Canónica: `{"schema":"public","table":"blog_posts","position":31,"name":"ai_search_queries_count","full_type":"integer","type_schema":"pg_catalog","internal_type":"int4","length":null,"precision":32,"scale":0,"nullable":true,"default":"0","identity":"","generated":"","collation_schema":null,"collation":null}`
- Clon: `{"schema":"public","table":"blog_posts","position":41,"name":"ai_search_queries_count","full_type":"integer","type_schema":"pg_catalog","internal_type":"int4","length":null,"precision":32,"scale":0,"nullable":true,"default":"0","identity":"","generated":"","collation_schema":null,"collation":null}`

### public.delitos.actualizado_en

Clasificación: `SAME_NAME_DIFFERENT_DEFINITION`

- Canónica: `{"schema":"public","table":"delitos","position":17,"name":"actualizado_en","full_type":"timestamp with time zone","type_schema":"pg_catalog","internal_type":"timestamptz","length":null,"precision":null,"scale":null,"nullable":true,"default":null,"identity":"","generated":"","collation_schema":null,"collation":null}`
- Clon: `{"schema":"public","table":"delitos","position":16,"name":"actualizado_en","full_type":"timestamp with time zone","type_schema":"pg_catalog","internal_type":"timestamptz","length":null,"precision":null,"scale":null,"nullable":true,"default":null,"identity":"","generated":"","collation_schema":null,"collation":null}`

### public.delitos.agravacion_por_articulo_remitido

Clasificación: `SAME_NAME_DIFFERENT_DEFINITION`

- Canónica: `{"schema":"public","table":"delitos","position":22,"name":"agravacion_por_articulo_remitido","full_type":"text","type_schema":"pg_catalog","internal_type":"text","length":null,"precision":null,"scale":null,"nullable":true,"default":null,"identity":"","generated":"","collation_schema":"pg_catalog","collation":"default"}`
- Clon: `{"schema":"public","table":"delitos","position":23,"name":"agravacion_por_articulo_remitido","full_type":"text","type_schema":"pg_catalog","internal_type":"text","length":null,"precision":null,"scale":null,"nullable":true,"default":null,"identity":"","generated":"","collation_schema":"pg_catalog","collation":"default"}`

### public.delitos.articulos_remitidos_para_pena

Clasificación: `SAME_NAME_DIFFERENT_DEFINITION`

- Canónica: `{"schema":"public","table":"delitos","position":19,"name":"articulos_remitidos_para_pena","full_type":"text","type_schema":"pg_catalog","internal_type":"text","length":null,"precision":null,"scale":null,"nullable":true,"default":null,"identity":"","generated":"","collation_schema":"pg_catalog","collation":"default"}`
- Clon: `{"schema":"public","table":"delitos","position":20,"name":"articulos_remitidos_para_pena","full_type":"text","type_schema":"pg_catalog","internal_type":"text","length":null,"precision":null,"scale":null,"nullable":true,"default":null,"identity":"","generated":"","collation_schema":"pg_catalog","collation":"default"}`

### public.delitos.condicion_para_aplicar_pena_remitida

Clasificación: `SAME_NAME_DIFFERENT_DEFINITION`

- Canónica: `{"schema":"public","table":"delitos","position":21,"name":"condicion_para_aplicar_pena_remitida","full_type":"text","type_schema":"pg_catalog","internal_type":"text","length":null,"precision":null,"scale":null,"nullable":true,"default":null,"identity":"","generated":"","collation_schema":"pg_catalog","collation":"default"}`
- Clon: `{"schema":"public","table":"delitos","position":22,"name":"condicion_para_aplicar_pena_remitida","full_type":"text","type_schema":"pg_catalog","internal_type":"text","length":null,"precision":null,"scale":null,"nullable":true,"default":null,"identity":"","generated":"","collation_schema":"pg_catalog","collation":"default"}`

### public.delitos.constitucion_articulo_id

Clasificación: `SAME_NAME_DIFFERENT_DEFINITION`

- Canónica: `{"schema":"public","table":"delitos","position":7,"name":"constitucion_articulo_id","full_type":"integer","type_schema":"pg_catalog","internal_type":"int4","length":null,"precision":32,"scale":0,"nullable":true,"default":null,"identity":"","generated":"","collation_schema":null,"collation":null}`
- Clon: `{"schema":"public","table":"delitos","position":18,"name":"constitucion_articulo_id","full_type":"integer","type_schema":"pg_catalog","internal_type":"int4","length":null,"precision":32,"scale":0,"nullable":true,"default":null,"identity":"","generated":"","collation_schema":null,"collation":null}`

### public.delitos.creado_en

Clasificación: `SAME_NAME_DIFFERENT_DEFINITION`

- Canónica: `{"schema":"public","table":"delitos","position":16,"name":"creado_en","full_type":"timestamp with time zone","type_schema":"pg_catalog","internal_type":"timestamptz","length":null,"precision":null,"scale":null,"nullable":true,"default":"now()","identity":"","generated":"","collation_schema":null,"collation":null}`
- Clon: `{"schema":"public","table":"delitos","position":15,"name":"creado_en","full_type":"timestamp with time zone","type_schema":"pg_catalog","internal_type":"timestamptz","length":null,"precision":null,"scale":null,"nullable":true,"default":"now()","identity":"","generated":"","collation_schema":null,"collation":null}`

### public.delitos.es_grave

Clasificación: `SAME_NAME_DIFFERENT_DEFINITION`

- Canónica: `{"schema":"public","table":"delitos","position":15,"name":"es_grave","full_type":"boolean","type_schema":"pg_catalog","internal_type":"bool","length":null,"precision":null,"scale":null,"nullable":true,"default":"false","identity":"","generated":"","collation_schema":null,"collation":null}`
- Clon: `{"schema":"public","table":"delitos","position":13,"name":"es_grave","full_type":"boolean","type_schema":"pg_catalog","internal_type":"bool","length":null,"precision":null,"scale":null,"nullable":true,"default":"false","identity":"","generated":"","collation_schema":null,"collation":null}`

### public.delitos.formula_calculo_remision

Clasificación: `SAME_NAME_DIFFERENT_DEFINITION`

- Canónica: `{"schema":"public","table":"delitos","position":23,"name":"formula_calculo_remision","full_type":"text","type_schema":"pg_catalog","internal_type":"text","length":null,"precision":null,"scale":null,"nullable":true,"default":null,"identity":"","generated":"","collation_schema":"pg_catalog","collation":"default"}`
- Clon: `{"schema":"public","table":"delitos","position":24,"name":"formula_calculo_remision","full_type":"text","type_schema":"pg_catalog","internal_type":"text","length":null,"precision":null,"scale":null,"nullable":true,"default":null,"identity":"","generated":"","collation_schema":"pg_catalog","collation":"default"}`

### public.delitos.observaciones

Clasificación: `SAME_NAME_DIFFERENT_DEFINITION`

- Canónica: `{"schema":"public","table":"delitos","position":14,"name":"observaciones","full_type":"text","type_schema":"pg_catalog","internal_type":"text","length":null,"precision":null,"scale":null,"nullable":true,"default":null,"identity":"","generated":"","collation_schema":"pg_catalog","collation":"default"}`
- Clon: `{"schema":"public","table":"delitos","position":12,"name":"observaciones","full_type":"text","type_schema":"pg_catalog","internal_type":"text","length":null,"precision":null,"scale":null,"nullable":true,"default":null,"identity":"","generated":"","collation_schema":"pg_catalog","collation":"default"}`

### public.delitos.observaciones_remision_normativa

Clasificación: `SAME_NAME_DIFFERENT_DEFINITION`

- Canónica: `{"schema":"public","table":"delitos","position":28,"name":"observaciones_remision_normativa","full_type":"text","type_schema":"pg_catalog","internal_type":"text","length":null,"precision":null,"scale":null,"nullable":true,"default":null,"identity":"","generated":"","collation_schema":"pg_catalog","collation":"default"}`
- Clon: `{"schema":"public","table":"delitos","position":29,"name":"observaciones_remision_normativa","full_type":"text","type_schema":"pg_catalog","internal_type":"text","length":null,"precision":null,"scale":null,"nullable":true,"default":null,"identity":"","generated":"","collation_schema":"pg_catalog","collation":"default"}`

### public.delitos.pena_alternativa_max

Clasificación: `SAME_NAME_DIFFERENT_DEFINITION`

- Canónica: `{"schema":"public","table":"delitos","position":12,"name":"pena_alternativa_max","full_type":"integer","type_schema":"pg_catalog","internal_type":"int4","length":null,"precision":32,"scale":0,"nullable":true,"default":"0","identity":"","generated":"","collation_schema":null,"collation":null}`
- Clon: `{"schema":"public","table":"delitos","position":10,"name":"pena_alternativa_max","full_type":"integer","type_schema":"pg_catalog","internal_type":"int4","length":null,"precision":32,"scale":0,"nullable":true,"default":"0","identity":"","generated":"","collation_schema":null,"collation":null}`

### public.delitos.pena_alternativa_min

Clasificación: `SAME_NAME_DIFFERENT_DEFINITION`

- Canónica: `{"schema":"public","table":"delitos","position":11,"name":"pena_alternativa_min","full_type":"integer","type_schema":"pg_catalog","internal_type":"int4","length":null,"precision":32,"scale":0,"nullable":true,"default":"0","identity":"","generated":"","collation_schema":null,"collation":null}`
- Clon: `{"schema":"public","table":"delitos","position":9,"name":"pena_alternativa_min","full_type":"integer","type_schema":"pg_catalog","internal_type":"int4","length":null,"precision":32,"scale":0,"nullable":true,"default":"0","identity":"","generated":"","collation_schema":null,"collation":null}`

### public.delitos.pena_base_resuelta_desde_articulo

Clasificación: `SAME_NAME_DIFFERENT_DEFINITION`

- Canónica: `{"schema":"public","table":"delitos","position":20,"name":"pena_base_resuelta_desde_articulo","full_type":"character varying(200)","type_schema":"pg_catalog","internal_type":"varchar","length":200,"precision":null,"scale":null,"nullable":true,"default":null,"identity":"","generated":"","collation_schema":"pg_catalog","collation":"default"}`
- Clon: `{"schema":"public","table":"delitos","position":21,"name":"pena_base_resuelta_desde_articulo","full_type":"character varying(200)","type_schema":"pg_catalog","internal_type":"varchar","length":200,"precision":null,"scale":null,"nullable":true,"default":null,"identity":"","generated":"","collation_schema":"pg_catalog","collation":"default"}`

### public.delitos.pena_maxima_meses

Clasificación: `SAME_NAME_DIFFERENT_DEFINITION`

- Canónica: `{"schema":"public","table":"delitos","position":9,"name":"pena_maxima_meses","full_type":"integer","type_schema":"pg_catalog","internal_type":"int4","length":null,"precision":32,"scale":0,"nullable":false,"default":null,"identity":"","generated":"","collation_schema":null,"collation":null}`
- Clon: `{"schema":"public","table":"delitos","position":7,"name":"pena_maxima_meses","full_type":"integer","type_schema":"pg_catalog","internal_type":"int4","length":null,"precision":32,"scale":0,"nullable":false,"default":null,"identity":"","generated":"","collation_schema":null,"collation":null}`

### public.delitos.pena_minima_meses

Clasificación: `SAME_NAME_DIFFERENT_DEFINITION`

- Canónica: `{"schema":"public","table":"delitos","position":8,"name":"pena_minima_meses","full_type":"integer","type_schema":"pg_catalog","internal_type":"int4","length":null,"precision":32,"scale":0,"nullable":false,"default":null,"identity":"","generated":"","collation_schema":null,"collation":null}`
- Clon: `{"schema":"public","table":"delitos","position":6,"name":"pena_minima_meses","full_type":"integer","type_schema":"pg_catalog","internal_type":"int4","length":null,"precision":32,"scale":0,"nullable":false,"default":null,"identity":"","generated":"","collation_schema":null,"collation":null}`

### public.delitos.pena_por_remision_normativa

Clasificación: `SAME_NAME_DIFFERENT_DEFINITION`

- Canónica: `{"schema":"public","table":"delitos","position":18,"name":"pena_por_remision_normativa","full_type":"boolean","type_schema":"pg_catalog","internal_type":"bool","length":null,"precision":null,"scale":null,"nullable":true,"default":"false","identity":"","generated":"","collation_schema":null,"collation":null}`
- Clon: `{"schema":"public","table":"delitos","position":19,"name":"pena_por_remision_normativa","full_type":"boolean","type_schema":"pg_catalog","internal_type":"bool","length":null,"precision":null,"scale":null,"nullable":true,"default":"false","identity":"","generated":"","collation_schema":null,"collation":null}`

### public.delitos.pena_resuelta_max_meses

Clasificación: `SAME_NAME_DIFFERENT_DEFINITION`

- Canónica: `{"schema":"public","table":"delitos","position":27,"name":"pena_resuelta_max_meses","full_type":"integer","type_schema":"pg_catalog","internal_type":"int4","length":null,"precision":32,"scale":0,"nullable":true,"default":null,"identity":"","generated":"","collation_schema":null,"collation":null}`
- Clon: `{"schema":"public","table":"delitos","position":28,"name":"pena_resuelta_max_meses","full_type":"integer","type_schema":"pg_catalog","internal_type":"int4","length":null,"precision":32,"scale":0,"nullable":true,"default":null,"identity":"","generated":"","collation_schema":null,"collation":null}`

### public.delitos.pena_resuelta_min_meses

Clasificación: `SAME_NAME_DIFFERENT_DEFINITION`

- Canónica: `{"schema":"public","table":"delitos","position":26,"name":"pena_resuelta_min_meses","full_type":"integer","type_schema":"pg_catalog","internal_type":"int4","length":null,"precision":32,"scale":0,"nullable":true,"default":null,"identity":"","generated":"","collation_schema":null,"collation":null}`
- Clon: `{"schema":"public","table":"delitos","position":27,"name":"pena_resuelta_min_meses","full_type":"integer","type_schema":"pg_catalog","internal_type":"int4","length":null,"precision":32,"scale":0,"nullable":true,"default":null,"identity":"","generated":"","collation_schema":null,"collation":null}`

### public.delitos.penas_accesorias

Clasificación: `SAME_NAME_DIFFERENT_DEFINITION`

- Canónica: `{"schema":"public","table":"delitos","position":13,"name":"penas_accesorias","full_type":"text[]","type_schema":"pg_catalog","internal_type":"_text","length":null,"precision":null,"scale":null,"nullable":true,"default":"'{}'::text[]","identity":"","generated":"","collation_schema":"pg_catalog","collation":"default"}`
- Clon: `{"schema":"public","table":"delitos","position":11,"name":"penas_accesorias","full_type":"text[]","type_schema":"pg_catalog","internal_type":"_text","length":null,"precision":null,"scale":null,"nullable":true,"default":"'{}'::text[]","identity":"","generated":"","collation_schema":"pg_catalog","collation":"default"}`

### public.delitos.rama_id

Clasificación: `SAME_NAME_DIFFERENT_DEFINITION`

- Canónica: `{"schema":"public","table":"delitos","position":6,"name":"rama_id","full_type":"character varying(100)","type_schema":"pg_catalog","internal_type":"varchar","length":100,"precision":null,"scale":null,"nullable":true,"default":null,"identity":"","generated":"","collation_schema":"pg_catalog","collation":"default"}`
- Clon: `{"schema":"public","table":"delitos","position":17,"name":"rama_id","full_type":"character varying(100)","type_schema":"pg_catalog","internal_type":"varchar","length":100,"precision":null,"scale":null,"nullable":true,"default":null,"identity":"","generated":"","collation_schema":"pg_catalog","collation":"default"}`

### public.delitos.requiere_datos_economicos

Clasificación: `SAME_NAME_DIFFERENT_DEFINITION`

- Canónica: `{"schema":"public","table":"delitos","position":24,"name":"requiere_datos_economicos","full_type":"boolean","type_schema":"pg_catalog","internal_type":"bool","length":null,"precision":null,"scale":null,"nullable":true,"default":"false","identity":"","generated":"","collation_schema":null,"collation":null}`
- Clon: `{"schema":"public","table":"delitos","position":25,"name":"requiere_datos_economicos","full_type":"boolean","type_schema":"pg_catalog","internal_type":"bool","length":null,"precision":null,"scale":null,"nullable":true,"default":"false","identity":"","generated":"","collation_schema":null,"collation":null}`

### public.delitos.tiene_pena_alternativa

Clasificación: `SAME_NAME_DIFFERENT_DEFINITION`

- Canónica: `{"schema":"public","table":"delitos","position":10,"name":"tiene_pena_alternativa","full_type":"boolean","type_schema":"pg_catalog","internal_type":"bool","length":null,"precision":null,"scale":null,"nullable":true,"default":"false","identity":"","generated":"","collation_schema":null,"collation":null}`
- Clon: `{"schema":"public","table":"delitos","position":8,"name":"tiene_pena_alternativa","full_type":"boolean","type_schema":"pg_catalog","internal_type":"bool","length":null,"precision":null,"scale":null,"nullable":true,"default":"false","identity":"","generated":"","collation_schema":null,"collation":null}`

### public.delitos.variables_necesarias_para_calculo

Clasificación: `SAME_NAME_DIFFERENT_DEFINITION`

- Canónica: `{"schema":"public","table":"delitos","position":25,"name":"variables_necesarias_para_calculo","full_type":"text","type_schema":"pg_catalog","internal_type":"text","length":null,"precision":null,"scale":null,"nullable":true,"default":null,"identity":"","generated":"","collation_schema":"pg_catalog","collation":"default"}`
- Clon: `{"schema":"public","table":"delitos","position":26,"name":"variables_necesarias_para_calculo","full_type":"text","type_schema":"pg_catalog","internal_type":"text","length":null,"precision":null,"scale":null,"nullable":true,"default":null,"identity":"","generated":"","collation_schema":"pg_catalog","collation":"default"}`

### public.extracciones_ia.input_hash

Clasificación: `SAME_NAME_DIFFERENT_DEFINITION`

- Canónica: `{"schema":"public","table":"extracciones_ia","position":15,"name":"input_hash","full_type":"character varying(64)","type_schema":"pg_catalog","internal_type":"varchar","length":64,"precision":null,"scale":null,"nullable":true,"default":null,"identity":"","generated":"","collation_schema":"pg_catalog","collation":"default"}`
- Clon: `{"schema":"public","table":"extracciones_ia","position":14,"name":"input_hash","full_type":"character varying(64)","type_schema":"pg_catalog","internal_type":"varchar","length":64,"precision":null,"scale":null,"nullable":true,"default":null,"identity":"","generated":"","collation_schema":"pg_catalog","collation":"default"}`

### public.extracciones_ia.run_status

Clasificación: `SAME_NAME_DIFFERENT_DEFINITION`

- Canónica: `{"schema":"public","table":"extracciones_ia","position":16,"name":"run_status","full_type":"character varying(20)","type_schema":"pg_catalog","internal_type":"varchar","length":20,"precision":null,"scale":null,"nullable":true,"default":"'completed'::character varying","identity":"","generated":"","collation_schema":"pg_catalog","collation":"default"}`
- Clon: `{"schema":"public","table":"extracciones_ia","position":15,"name":"run_status","full_type":"character varying(20)","type_schema":"pg_catalog","internal_type":"varchar","length":20,"precision":null,"scale":null,"nullable":true,"default":"'completed'::character varying","identity":"","generated":"","collation_schema":"pg_catalog","collation":"default"}`

### public.extracciones_ia.suggested_status

Clasificación: `SAME_NAME_DIFFERENT_DEFINITION`

- Canónica: `{"schema":"public","table":"extracciones_ia","position":13,"name":"suggested_status","full_type":"character varying(50)","type_schema":"pg_catalog","internal_type":"varchar","length":50,"precision":null,"scale":null,"nullable":true,"default":null,"identity":"","generated":"","collation_schema":"pg_catalog","collation":"default"}`
- Clon: `{"schema":"public","table":"extracciones_ia","position":16,"name":"suggested_status","full_type":"character varying(50)","type_schema":"pg_catalog","internal_type":"varchar","length":50,"precision":null,"scale":null,"nullable":true,"default":null,"identity":"","generated":"","collation_schema":"pg_catalog","collation":"default"}`

### public.extracciones_ia.total_confidence

Clasificación: `SAME_NAME_DIFFERENT_DEFINITION`

- Canónica: `{"schema":"public","table":"extracciones_ia","position":14,"name":"total_confidence","full_type":"integer","type_schema":"pg_catalog","internal_type":"int4","length":null,"precision":32,"scale":0,"nullable":true,"default":null,"identity":"","generated":"","collation_schema":null,"collation":null}`
- Clon: `{"schema":"public","table":"extracciones_ia","position":13,"name":"total_confidence","full_type":"integer","type_schema":"pg_catalog","internal_type":"int4","length":null,"precision":32,"scale":0,"nullable":true,"default":null,"identity":"","generated":"","collation_schema":null,"collation":null}`

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

### public.case_readiness_checks.case_readiness_checks_run_check_unique

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"public","table":"case_readiness_checks","name":"case_readiness_checks_run_check_unique","type":"UNIQUE","definition":"UNIQUE (run_id, check_name)","columns":"{run_id,check_name}","referenced_schema":null,"referenced_table":null,"referenced_columns":"{}","on_delete":null,"on_update":null,"deferrable":false,"initially_deferred":false,"validated":true}`

### public.document_text_pages.document_text_pages_documento_pagina_unique

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"public","table":"document_text_pages","name":"document_text_pages_documento_pagina_unique","type":"UNIQUE","definition":"UNIQUE (documento_id, page_number)","columns":"{documento_id,page_number}","referenced_schema":null,"referenced_table":null,"referenced_columns":"{}","on_delete":null,"on_update":null,"deferrable":false,"initially_deferred":false,"validated":true}`

### public.enlaces_magicos.enlaces_magicos_token_hash_unique

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"schema":"public","table":"enlaces_magicos","name":"enlaces_magicos_token_hash_unique","type":"UNIQUE","definition":"UNIQUE (token_hash)","columns":"{token_hash}","referenced_schema":null,"referenced_table":null,"referenced_columns":"{}","on_delete":null,"on_update":null,"deferrable":false,"initially_deferred":false,"validated":true}`

### public.auditoria_accion

Clasificación: `SAME_NAME_DIFFERENT_DEFINITION`

- Canónica: `{"schema":"public","name":"auditoria_accion","values":"{login,logout,login_failed,caso_created,caso_updated,caso_deleted,calculo_created,calculo_deleted,delito_created,delito_updated,delito_deleted,rate_limited,unauthorized_access,usuario_created,usuario_updated,usuario_deleted,password_reset,password_changed,blog_created,blog_updated,blog_deleted,blog_generated,faq_created,faq_updated,faq_deleted,site_config_updated,categoria_blog_created,categoria_blog_updated,categoria_blog_deleted,categoria_faq_created,categoria_faq_updated,categoria_faq_deleted,tag_created,tag_updated,tag_deleted,autor_created,autor_updated,autor_deleted,pagina_cms_created,pagina_cms_updated,pagina_cms_deleted,area_juridica_created,area_juridica_updated,area_juridica_deleted,medio_created,medio_updated,medio_deleted,redirect_created,redirect_updated,redirect_deleted,menu_updated,rol_created,rol_updated,rol_deleted,permiso_updated,agravante_especifica_created,agravante_especifica_updated,agravante_especifica_deleted,expediente_created,expediente_updated,expediente_estado_changed,expediente_deleted,cliente_created,cliente_updated,cliente_deleted,documento_uploaded,documento_updated,documento_deleted,documento_ia_processed,enlace_created,enlace_revoked,enlace_used,magic_link_accessed,magic_link_expired,tarea_created,tarea_updated,tarea_completed,tarea_deleted,evento_created,evento_updated,evento_deleted,nota_created,nota_deleted,plantilla_created,plantilla_updated,plantilla_deleted,correo_sent,correo_failed,notificacion_created,notificacion_read,validacion_aprobada,validacion_rechazada,reminder_sent,case_blocked_by_client,case_unblocked,internal_escalation_created,document_extraction_started,document_extraction_completed,document_extraction_failed,document_requires_ocr,document_extraction_retried,document_manual_reviewed,ai_analysis_started,ai_analysis_completed,ai_analysis_failed,ai_analysis_skipped_no_text,ai_analysis_not_configured,ai_suggestion_accepted,ai_suggestion_rejected,ai_human_review_requested,ai_correction_requested,readiness_evaluation_completed,case_ready_for_review,case_returned_by_lawyer,case_documental_review_approved,case_additional_info_requested,invitacion_created,invitacion_accepted,invitacion_revoked,invitacion_resent,documento_bulk_approved,documento_bulk_reverted,signature_package_created,signature_package_ready,signature_package_locked,signature_package_cancelled,signature_package_superseded,signature_package_verified,signature_envelope_created,signature_envelope_sent,signature_envelope_completed,signature_envelope_cancelled,signature_envelope_declined,signature_envelope_expired,signature_webhook_received,signature_artifact_downloaded,calendar_connection_created,calendar_event_synced,calendar_event_sync_failed,calendar_conflict_resolved,calendar_feed_created,calendar_feed_revoked}"}`
- Clon: `{"schema":"public","name":"auditoria_accion","values":"{login,logout,login_failed,caso_created,caso_updated,caso_deleted,calculo_created,calculo_deleted,delito_created,delito_updated,delito_deleted,rate_limited,unauthorized_access,usuario_created,usuario_updated,usuario_deleted,password_reset,password_changed,blog_created,blog_updated,blog_deleted,blog_generated,faq_created,faq_updated,faq_deleted,site_config_updated,categoria_blog_created,categoria_blog_updated,categoria_blog_deleted,categoria_faq_created,categoria_faq_updated,categoria_faq_deleted,tag_created,tag_updated,tag_deleted,autor_created,autor_updated,autor_deleted,pagina_cms_created,pagina_cms_updated,pagina_cms_deleted,area_juridica_created,area_juridica_updated,area_juridica_deleted,medio_created,medio_updated,medio_deleted,redirect_created,redirect_updated,redirect_deleted,menu_updated,rol_created,rol_updated,rol_deleted,permiso_updated,agravante_especifica_created,agravante_especifica_updated,agravante_especifica_deleted,expediente_created,expediente_updated,expediente_estado_changed,expediente_deleted,cliente_created,cliente_updated,cliente_deleted,documento_uploaded,documento_updated,documento_deleted,documento_ia_processed,enlace_created,enlace_revoked,enlace_used,magic_link_accessed,magic_link_expired,tarea_created,tarea_updated,tarea_completed,tarea_deleted,evento_created,evento_updated,evento_deleted,nota_created,nota_deleted,plantilla_created,plantilla_updated,plantilla_deleted,correo_sent,correo_failed,notificacion_created,notificacion_read,validacion_aprobada,validacion_rechazada,reminder_sent,case_blocked_by_client,case_unblocked,internal_escalation_created,document_extraction_started,document_extraction_completed,document_extraction_failed,document_requires_ocr,document_extraction_retried,document_manual_reviewed,ai_analysis_started,ai_analysis_completed,ai_analysis_failed,ai_analysis_skipped_no_text,ai_analysis_not_configured,ai_suggestion_accepted,ai_suggestion_rejected,ai_human_review_requested,ai_correction_requested,readiness_evaluation_completed,case_ready_for_review,case_returned_by_lawyer,case_documental_review_approved,case_additional_info_requested,invitacion_created,invitacion_accepted,invitacion_revoked,invitacion_resent,documento_bulk_approved,documento_bulk_reverted,signature_package_created,signature_package_ready,signature_package_locked,signature_package_cancelled,signature_package_superseded,signature_package_verified,signature_envelope_created,signature_envelope_sent,signature_envelope_completed,signature_envelope_cancelled,signature_envelope_declined,signature_envelope_expired,signature_webhook_received,signature_artifact_downloaded,calendar_connection_created,calendar_event_synced,calendar_event_sync_failed,calendar_conflict_resolved,calendar_feed_created,calendar_feed_revoked,admin_access_repaired,sgie_access_repaired,session_invalidated_after_access_repair}"}`

### pg_session_jwt

Clasificación: `CLONE_ONLY`

- Canónica: `null`
- Clon: `{"name":"pg_session_jwt","version":"0.4.0","schema":"public"}`

### pgcrypto

Clasificación: `CANONICAL_ONLY`

- Canónica: `{"name":"pgcrypto","version":"1.3","schema":"public"}`
- Clon: `null`

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

### public.armor.bytea.function

Clasificación: `CANONICAL_ONLY`

- Canónica: `{"schema":"public","name":"armor","identity_arguments":"bytea","kind":"function","language":"c","volatility":"i","security_definer":false,"result":"text","definition":"CREATE OR REPLACE FUNCTION public.armor(bytea) RETURNS text LANGUAGE c IMMUTABLE PARALLEL SAFE STRICT AS '$libdir/pgcrypto', $function$pg_armor$function$"}`
- Clon: `null`

### public.armor.bytea, text[], text[].function

Clasificación: `CANONICAL_ONLY`

- Canónica: `{"schema":"public","name":"armor","identity_arguments":"bytea, text[], text[]","kind":"function","language":"c","volatility":"i","security_definer":false,"result":"text","definition":"CREATE OR REPLACE FUNCTION public.armor(bytea, text[], text[]) RETURNS text LANGUAGE c IMMUTABLE PARALLEL SAFE STRICT AS '$libdir/pgcrypto', $function$pg_armor$function$"}`
- Clon: `null`

### public.crypt.text, text.function

Clasificación: `CANONICAL_ONLY`

- Canónica: `{"schema":"public","name":"crypt","identity_arguments":"text, text","kind":"function","language":"c","volatility":"i","security_definer":false,"result":"text","definition":"CREATE OR REPLACE FUNCTION public.crypt(text, text) RETURNS text LANGUAGE c IMMUTABLE PARALLEL SAFE STRICT AS '$libdir/pgcrypto', $function$pg_crypt$function$"}`
- Clon: `null`

### public.dearmor.text.function

Clasificación: `CANONICAL_ONLY`

- Canónica: `{"schema":"public","name":"dearmor","identity_arguments":"text","kind":"function","language":"c","volatility":"i","security_definer":false,"result":"bytea","definition":"CREATE OR REPLACE FUNCTION public.dearmor(text) RETURNS bytea LANGUAGE c IMMUTABLE PARALLEL SAFE STRICT AS '$libdir/pgcrypto', $function$pg_dearmor$function$"}`
- Clon: `null`

### public.decrypt.bytea, bytea, text.function

Clasificación: `CANONICAL_ONLY`

- Canónica: `{"schema":"public","name":"decrypt","identity_arguments":"bytea, bytea, text","kind":"function","language":"c","volatility":"i","security_definer":false,"result":"bytea","definition":"CREATE OR REPLACE FUNCTION public.decrypt(bytea, bytea, text) RETURNS bytea LANGUAGE c IMMUTABLE PARALLEL SAFE STRICT AS '$libdir/pgcrypto', $function$pg_decrypt$function$"}`
- Clon: `null`

### public.decrypt_iv.bytea, bytea, bytea, text.function

Clasificación: `CANONICAL_ONLY`

- Canónica: `{"schema":"public","name":"decrypt_iv","identity_arguments":"bytea, bytea, bytea, text","kind":"function","language":"c","volatility":"i","security_definer":false,"result":"bytea","definition":"CREATE OR REPLACE FUNCTION public.decrypt_iv(bytea, bytea, bytea, text) RETURNS bytea LANGUAGE c IMMUTABLE PARALLEL SAFE STRICT AS '$libdir/pgcrypto', $function$pg_decrypt_iv$function$"}`
- Clon: `null`

### public.digest.bytea, text.function

Clasificación: `CANONICAL_ONLY`

- Canónica: `{"schema":"public","name":"digest","identity_arguments":"bytea, text","kind":"function","language":"c","volatility":"i","security_definer":false,"result":"bytea","definition":"CREATE OR REPLACE FUNCTION public.digest(bytea, text) RETURNS bytea LANGUAGE c IMMUTABLE PARALLEL SAFE STRICT AS '$libdir/pgcrypto', $function$pg_digest$function$"}`
- Clon: `null`

### public.digest.text, text.function

Clasificación: `CANONICAL_ONLY`

- Canónica: `{"schema":"public","name":"digest","identity_arguments":"text, text","kind":"function","language":"c","volatility":"i","security_definer":false,"result":"bytea","definition":"CREATE OR REPLACE FUNCTION public.digest(text, text) RETURNS bytea LANGUAGE c IMMUTABLE PARALLEL SAFE STRICT AS '$libdir/pgcrypto', $function$pg_digest$function$"}`
- Clon: `null`

### public.encrypt.bytea, bytea, text.function

Clasificación: `CANONICAL_ONLY`

- Canónica: `{"schema":"public","name":"encrypt","identity_arguments":"bytea, bytea, text","kind":"function","language":"c","volatility":"i","security_definer":false,"result":"bytea","definition":"CREATE OR REPLACE FUNCTION public.encrypt(bytea, bytea, text) RETURNS bytea LANGUAGE c IMMUTABLE PARALLEL SAFE STRICT AS '$libdir/pgcrypto', $function$pg_encrypt$function$"}`
- Clon: `null`

### public.encrypt_iv.bytea, bytea, bytea, text.function

Clasificación: `CANONICAL_ONLY`

- Canónica: `{"schema":"public","name":"encrypt_iv","identity_arguments":"bytea, bytea, bytea, text","kind":"function","language":"c","volatility":"i","security_definer":false,"result":"bytea","definition":"CREATE OR REPLACE FUNCTION public.encrypt_iv(bytea, bytea, bytea, text) RETURNS bytea LANGUAGE c IMMUTABLE PARALLEL SAFE STRICT AS '$libdir/pgcrypto', $function$pg_encrypt_iv$function$"}`
- Clon: `null`

### public.gen_random_bytes.integer.function

Clasificación: `CANONICAL_ONLY`

- Canónica: `{"schema":"public","name":"gen_random_bytes","identity_arguments":"integer","kind":"function","language":"c","volatility":"v","security_definer":false,"result":"bytea","definition":"CREATE OR REPLACE FUNCTION public.gen_random_bytes(integer) RETURNS bytea LANGUAGE c PARALLEL SAFE STRICT AS '$libdir/pgcrypto', $function$pg_random_bytes$function$"}`
- Clon: `null`

### public.gen_random_uuid..function

Clasificación: `CANONICAL_ONLY`

- Canónica: `{"schema":"public","name":"gen_random_uuid","identity_arguments":"","kind":"function","language":"c","volatility":"v","security_definer":false,"result":"uuid","definition":"CREATE OR REPLACE FUNCTION public.gen_random_uuid() RETURNS uuid LANGUAGE c PARALLEL SAFE AS '$libdir/pgcrypto', $function$pg_random_uuid$function$"}`
- Clon: `null`

### public.gen_salt.text.function

Clasificación: `CANONICAL_ONLY`

- Canónica: `{"schema":"public","name":"gen_salt","identity_arguments":"text","kind":"function","language":"c","volatility":"v","security_definer":false,"result":"text","definition":"CREATE OR REPLACE FUNCTION public.gen_salt(text) RETURNS text LANGUAGE c PARALLEL SAFE STRICT AS '$libdir/pgcrypto', $function$pg_gen_salt$function$"}`
- Clon: `null`

### public.gen_salt.text, integer.function

Clasificación: `CANONICAL_ONLY`

- Canónica: `{"schema":"public","name":"gen_salt","identity_arguments":"text, integer","kind":"function","language":"c","volatility":"v","security_definer":false,"result":"text","definition":"CREATE OR REPLACE FUNCTION public.gen_salt(text, integer) RETURNS text LANGUAGE c PARALLEL SAFE STRICT AS '$libdir/pgcrypto', $function$pg_gen_salt_rounds$function$"}`
- Clon: `null`

### public.hmac.bytea, bytea, text.function

Clasificación: `CANONICAL_ONLY`

- Canónica: `{"schema":"public","name":"hmac","identity_arguments":"bytea, bytea, text","kind":"function","language":"c","volatility":"i","security_definer":false,"result":"bytea","definition":"CREATE OR REPLACE FUNCTION public.hmac(bytea, bytea, text) RETURNS bytea LANGUAGE c IMMUTABLE PARALLEL SAFE STRICT AS '$libdir/pgcrypto', $function$pg_hmac$function$"}`
- Clon: `null`

### public.hmac.text, text, text.function

Clasificación: `CANONICAL_ONLY`

- Canónica: `{"schema":"public","name":"hmac","identity_arguments":"text, text, text","kind":"function","language":"c","volatility":"i","security_definer":false,"result":"bytea","definition":"CREATE OR REPLACE FUNCTION public.hmac(text, text, text) RETURNS bytea LANGUAGE c IMMUTABLE PARALLEL SAFE STRICT AS '$libdir/pgcrypto', $function$pg_hmac$function$"}`
- Clon: `null`

### public.pgp_armor_headers.text, OUT key text, OUT value text.function

Clasificación: `CANONICAL_ONLY`

- Canónica: `{"schema":"public","name":"pgp_armor_headers","identity_arguments":"text, OUT key text, OUT value text","kind":"function","language":"c","volatility":"i","security_definer":false,"result":"SETOF record","definition":"CREATE OR REPLACE FUNCTION public.pgp_armor_headers(text, OUT key text, OUT value text) RETURNS SETOF record LANGUAGE c IMMUTABLE PARALLEL SAFE STRICT AS '$libdir/pgcrypto', $function$pgp_armor_headers$function$"}`
- Clon: `null`

### public.pgp_key_id.bytea.function

Clasificación: `CANONICAL_ONLY`

- Canónica: `{"schema":"public","name":"pgp_key_id","identity_arguments":"bytea","kind":"function","language":"c","volatility":"i","security_definer":false,"result":"text","definition":"CREATE OR REPLACE FUNCTION public.pgp_key_id(bytea) RETURNS text LANGUAGE c IMMUTABLE PARALLEL SAFE STRICT AS '$libdir/pgcrypto', $function$pgp_key_id_w$function$"}`
- Clon: `null`

### public.pgp_pub_decrypt.bytea, bytea.function

Clasificación: `CANONICAL_ONLY`

- Canónica: `{"schema":"public","name":"pgp_pub_decrypt","identity_arguments":"bytea, bytea","kind":"function","language":"c","volatility":"i","security_definer":false,"result":"text","definition":"CREATE OR REPLACE FUNCTION public.pgp_pub_decrypt(bytea, bytea) RETURNS text LANGUAGE c IMMUTABLE PARALLEL SAFE STRICT AS '$libdir/pgcrypto', $function$pgp_pub_decrypt_text$function$"}`
- Clon: `null`

### public.pgp_pub_decrypt.bytea, bytea, text.function

Clasificación: `CANONICAL_ONLY`

- Canónica: `{"schema":"public","name":"pgp_pub_decrypt","identity_arguments":"bytea, bytea, text","kind":"function","language":"c","volatility":"i","security_definer":false,"result":"text","definition":"CREATE OR REPLACE FUNCTION public.pgp_pub_decrypt(bytea, bytea, text) RETURNS text LANGUAGE c IMMUTABLE PARALLEL SAFE STRICT AS '$libdir/pgcrypto', $function$pgp_pub_decrypt_text$function$"}`
- Clon: `null`

### public.pgp_pub_decrypt.bytea, bytea, text, text.function

Clasificación: `CANONICAL_ONLY`

- Canónica: `{"schema":"public","name":"pgp_pub_decrypt","identity_arguments":"bytea, bytea, text, text","kind":"function","language":"c","volatility":"i","security_definer":false,"result":"text","definition":"CREATE OR REPLACE FUNCTION public.pgp_pub_decrypt(bytea, bytea, text, text) RETURNS text LANGUAGE c IMMUTABLE PARALLEL SAFE STRICT AS '$libdir/pgcrypto', $function$pgp_pub_decrypt_text$function$"}`
- Clon: `null`

### public.pgp_pub_decrypt_bytea.bytea, bytea.function

Clasificación: `CANONICAL_ONLY`

- Canónica: `{"schema":"public","name":"pgp_pub_decrypt_bytea","identity_arguments":"bytea, bytea","kind":"function","language":"c","volatility":"i","security_definer":false,"result":"bytea","definition":"CREATE OR REPLACE FUNCTION public.pgp_pub_decrypt_bytea(bytea, bytea) RETURNS bytea LANGUAGE c IMMUTABLE PARALLEL SAFE STRICT AS '$libdir/pgcrypto', $function$pgp_pub_decrypt_bytea$function$"}`
- Clon: `null`

### public.pgp_pub_decrypt_bytea.bytea, bytea, text.function

Clasificación: `CANONICAL_ONLY`

- Canónica: `{"schema":"public","name":"pgp_pub_decrypt_bytea","identity_arguments":"bytea, bytea, text","kind":"function","language":"c","volatility":"i","security_definer":false,"result":"bytea","definition":"CREATE OR REPLACE FUNCTION public.pgp_pub_decrypt_bytea(bytea, bytea, text) RETURNS bytea LANGUAGE c IMMUTABLE PARALLEL SAFE STRICT AS '$libdir/pgcrypto', $function$pgp_pub_decrypt_bytea$function$"}`
- Clon: `null`

### public.pgp_pub_decrypt_bytea.bytea, bytea, text, text.function

Clasificación: `CANONICAL_ONLY`

- Canónica: `{"schema":"public","name":"pgp_pub_decrypt_bytea","identity_arguments":"bytea, bytea, text, text","kind":"function","language":"c","volatility":"i","security_definer":false,"result":"bytea","definition":"CREATE OR REPLACE FUNCTION public.pgp_pub_decrypt_bytea(bytea, bytea, text, text) RETURNS bytea LANGUAGE c IMMUTABLE PARALLEL SAFE STRICT AS '$libdir/pgcrypto', $function$pgp_pub_decrypt_bytea$function$"}`
- Clon: `null`

### public.pgp_pub_encrypt.text, bytea.function

Clasificación: `CANONICAL_ONLY`

- Canónica: `{"schema":"public","name":"pgp_pub_encrypt","identity_arguments":"text, bytea","kind":"function","language":"c","volatility":"v","security_definer":false,"result":"bytea","definition":"CREATE OR REPLACE FUNCTION public.pgp_pub_encrypt(text, bytea) RETURNS bytea LANGUAGE c PARALLEL SAFE STRICT AS '$libdir/pgcrypto', $function$pgp_pub_encrypt_text$function$"}`
- Clon: `null`

### public.pgp_pub_encrypt.text, bytea, text.function

Clasificación: `CANONICAL_ONLY`

- Canónica: `{"schema":"public","name":"pgp_pub_encrypt","identity_arguments":"text, bytea, text","kind":"function","language":"c","volatility":"v","security_definer":false,"result":"bytea","definition":"CREATE OR REPLACE FUNCTION public.pgp_pub_encrypt(text, bytea, text) RETURNS bytea LANGUAGE c PARALLEL SAFE STRICT AS '$libdir/pgcrypto', $function$pgp_pub_encrypt_text$function$"}`
- Clon: `null`

### public.pgp_pub_encrypt_bytea.bytea, bytea.function

Clasificación: `CANONICAL_ONLY`

- Canónica: `{"schema":"public","name":"pgp_pub_encrypt_bytea","identity_arguments":"bytea, bytea","kind":"function","language":"c","volatility":"v","security_definer":false,"result":"bytea","definition":"CREATE OR REPLACE FUNCTION public.pgp_pub_encrypt_bytea(bytea, bytea) RETURNS bytea LANGUAGE c PARALLEL SAFE STRICT AS '$libdir/pgcrypto', $function$pgp_pub_encrypt_bytea$function$"}`
- Clon: `null`

### public.pgp_pub_encrypt_bytea.bytea, bytea, text.function

Clasificación: `CANONICAL_ONLY`

- Canónica: `{"schema":"public","name":"pgp_pub_encrypt_bytea","identity_arguments":"bytea, bytea, text","kind":"function","language":"c","volatility":"v","security_definer":false,"result":"bytea","definition":"CREATE OR REPLACE FUNCTION public.pgp_pub_encrypt_bytea(bytea, bytea, text) RETURNS bytea LANGUAGE c PARALLEL SAFE STRICT AS '$libdir/pgcrypto', $function$pgp_pub_encrypt_bytea$function$"}`
- Clon: `null`

### public.pgp_sym_decrypt.bytea, text.function

Clasificación: `CANONICAL_ONLY`

- Canónica: `{"schema":"public","name":"pgp_sym_decrypt","identity_arguments":"bytea, text","kind":"function","language":"c","volatility":"i","security_definer":false,"result":"text","definition":"CREATE OR REPLACE FUNCTION public.pgp_sym_decrypt(bytea, text) RETURNS text LANGUAGE c IMMUTABLE PARALLEL SAFE STRICT AS '$libdir/pgcrypto', $function$pgp_sym_decrypt_text$function$"}`
- Clon: `null`

### public.pgp_sym_decrypt.bytea, text, text.function

Clasificación: `CANONICAL_ONLY`

- Canónica: `{"schema":"public","name":"pgp_sym_decrypt","identity_arguments":"bytea, text, text","kind":"function","language":"c","volatility":"i","security_definer":false,"result":"text","definition":"CREATE OR REPLACE FUNCTION public.pgp_sym_decrypt(bytea, text, text) RETURNS text LANGUAGE c IMMUTABLE PARALLEL SAFE STRICT AS '$libdir/pgcrypto', $function$pgp_sym_decrypt_text$function$"}`
- Clon: `null`

### public.pgp_sym_decrypt_bytea.bytea, text.function

Clasificación: `CANONICAL_ONLY`

- Canónica: `{"schema":"public","name":"pgp_sym_decrypt_bytea","identity_arguments":"bytea, text","kind":"function","language":"c","volatility":"i","security_definer":false,"result":"bytea","definition":"CREATE OR REPLACE FUNCTION public.pgp_sym_decrypt_bytea(bytea, text) RETURNS bytea LANGUAGE c IMMUTABLE PARALLEL SAFE STRICT AS '$libdir/pgcrypto', $function$pgp_sym_decrypt_bytea$function$"}`
- Clon: `null`

### public.pgp_sym_decrypt_bytea.bytea, text, text.function

Clasificación: `CANONICAL_ONLY`

- Canónica: `{"schema":"public","name":"pgp_sym_decrypt_bytea","identity_arguments":"bytea, text, text","kind":"function","language":"c","volatility":"i","security_definer":false,"result":"bytea","definition":"CREATE OR REPLACE FUNCTION public.pgp_sym_decrypt_bytea(bytea, text, text) RETURNS bytea LANGUAGE c IMMUTABLE PARALLEL SAFE STRICT AS '$libdir/pgcrypto', $function$pgp_sym_decrypt_bytea$function$"}`
- Clon: `null`

### public.pgp_sym_encrypt.text, text.function

Clasificación: `CANONICAL_ONLY`

- Canónica: `{"schema":"public","name":"pgp_sym_encrypt","identity_arguments":"text, text","kind":"function","language":"c","volatility":"v","security_definer":false,"result":"bytea","definition":"CREATE OR REPLACE FUNCTION public.pgp_sym_encrypt(text, text) RETURNS bytea LANGUAGE c PARALLEL SAFE STRICT AS '$libdir/pgcrypto', $function$pgp_sym_encrypt_text$function$"}`
- Clon: `null`

### public.pgp_sym_encrypt.text, text, text.function

Clasificación: `CANONICAL_ONLY`

- Canónica: `{"schema":"public","name":"pgp_sym_encrypt","identity_arguments":"text, text, text","kind":"function","language":"c","volatility":"v","security_definer":false,"result":"bytea","definition":"CREATE OR REPLACE FUNCTION public.pgp_sym_encrypt(text, text, text) RETURNS bytea LANGUAGE c PARALLEL SAFE STRICT AS '$libdir/pgcrypto', $function$pgp_sym_encrypt_text$function$"}`
- Clon: `null`

### public.pgp_sym_encrypt_bytea.bytea, text.function

Clasificación: `CANONICAL_ONLY`

- Canónica: `{"schema":"public","name":"pgp_sym_encrypt_bytea","identity_arguments":"bytea, text","kind":"function","language":"c","volatility":"v","security_definer":false,"result":"bytea","definition":"CREATE OR REPLACE FUNCTION public.pgp_sym_encrypt_bytea(bytea, text) RETURNS bytea LANGUAGE c PARALLEL SAFE STRICT AS '$libdir/pgcrypto', $function$pgp_sym_encrypt_bytea$function$"}`
- Clon: `null`

### public.pgp_sym_encrypt_bytea.bytea, text, text.function

Clasificación: `CANONICAL_ONLY`

- Canónica: `{"schema":"public","name":"pgp_sym_encrypt_bytea","identity_arguments":"bytea, text, text","kind":"function","language":"c","volatility":"v","security_definer":false,"result":"bytea","definition":"CREATE OR REPLACE FUNCTION public.pgp_sym_encrypt_bytea(bytea, text, text) RETURNS bytea LANGUAGE c PARALLEL SAFE STRICT AS '$libdir/pgcrypto', $function$pgp_sym_encrypt_bytea$function$"}`
- Clon: `null`
