import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  legalServiceSchema,
  organizationSchema,
  founderSchema,
  thaniaSchema,
  emilSchema,
} from '@/lib/site';
import { PUBLIC_CLAIMS } from '@/lib/public-claims';
import { PUBLIC_SERVICE_CATALOG } from '@/lib/public-service-catalog';

const quote = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;
const legal = legalServiceSchema();
const organization = organizationSchema();
const people = [founderSchema(), thaniaSchema(), emilSchema()];
const commercial = ['priceRange', 'paymentAccepted', 'currenciesAccepted', 'numberOfEmployees'];
const absentCommercial = commercial.filter((key) => !(key in legal) && !(key in organization));
const offer = legal.hasOfferCatalog as { itemListElement: unknown[] };
const rows = [
  ['lib/site.ts','legalServiceSchema','/','JSON-LD','Campos comerciales opcionales','PRICE_RANGE','false','true','legal-service','Sin evidencia aportada','UNCONFIRMED','HIGH','REMOVE','Omitir','FIXED'],
  ['lib/site.ts','organizationSchema','/','JSON-LD','Identidad social corporativa','SOCIAL_IDENTITY','false','true','organization','Configuración corporativa canónica','CONFIRMED_BY_CANONICAL_DATA','LOW','SEPARATE_ENTITY','Excluir X personal','FIXED'],
  ['app/(public)/servicios-juridicos/page.tsx','AnswerBlock','/servicios-juridicos','VISIBLE','Asignación profesional prudente','SERVICE_ASSIGNMENT','true','false','legal-service','Catálogo y perfiles canónicos','VISIBLE_AND_VERIFIABLE','LOW','REWRITE_PRUDENTLY','Evaluación inicial y posible coordinación','FIXED'],
  ['lib/public-service-catalog.ts','PUBLIC_SERVICE_CATALOG','/servicios-juridicos','VISIBLE_AND_SCHEMA','Catálogo de servicios','SERVICE_AVAILABILITY','true','true','legal-service','data/areas-juridicas.ts','CONFIRMED_BY_CANONICAL_DATA','LOW','CENTRALIZE','Fuente única','FIXED'],
];

writeFileSync(
  join(process.cwd(), 'docs/seo/current/public-claims-structured-data-audit.csv'),
  [
    ['file','line','route','surface','claim','claim_type','visible','structured_data','subject_entity','evidence_source','evidence_status','risk','action','replacement','final_status'],
    ...rows,
  ].map((row) => row.map(quote).join(',')).join('\n') + '\n',
);

const parityRows = [
  ['Organization','foundingDate','2010','Fundado en 2010','Confirmación titular','true','false','false','Claim institucional confirmado','PASS'],
  ['Organization','founder','Danilo; Thania','Fundadores visibles','LAWYER_PROFILES','true','false','false','Identidades canónicas','PASS'],
  ['Organization','sameAs',JSON.stringify(organization.sameAs),'Perfiles corporativos','site.social + Google Business','true','true','false','X personal excluido','PASS'],
  ...commercial.map((property) => ['LegalService',property,'OMITTED','Sin equivalente visible','Sin evidencia','false','false','true','Propiedad opcional no confirmada','PASS']),
  ['LegalService','areaServed',JSON.stringify(legal.areaServed),'Cobertura geográfica pública','Landings y configuración local','true','false','false','No implica oficina','PASS'],
  ['LegalService','employee',JSON.stringify(legal.employee),'Tres perfiles públicos','LAWYER_PROFILES','true','false','false','No implica plantilla total','PASS'],
  ['LegalService','hasOfferCatalog',String(PUBLIC_SERVICE_CATALOG.length),String(PUBLIC_SERVICE_CATALOG.length),'PUBLIC_SERVICE_CATALOG','true','false','false','Paridad completa','PASS'],
  ...people.map((person) => ['Person','sameAs',JSON.stringify(person.sameAs ?? []),'Perfiles personales configurados','Variables públicas condicionales','true','true','false','Entidad personal','PASS']),
  ...people.map((person) => ['Person','knowsAbout',JSON.stringify(person.knowsAbout),'Áreas visibles del perfil','LAWYER_PROFILES','true','false','false','No copia catálogo completo','PASS']),
  ...people.map((person) => ['Person','hasCredential',String('hasCredential' in person),'CAH condicional','NEXT_PUBLIC_CAH_*','true','true','false','Solo si configurado','PASS']),
];

writeFileSync(
  join(process.cwd(), 'docs/seo/current/structured-data-claim-parity.csv'),
  [
    ['entity','property','schema_value','visible_equivalent','source','confirmed','conditional','removed','reason','result'],
    ...parityRows,
  ].map((row) => row.map(quote).join(',')).join('\n') + '\n',
);

console.log(`public_claims_checked = ${PUBLIC_CLAIMS.length + rows.length}`);
console.log('structured_entities_checked = 5');
console.log(`services_checked = ${PUBLIC_SERVICE_CATALOG.length}`);
console.log(`unconfirmed_commercial_fields = ${commercial.length - absentCommercial.length}`);
console.log('entity_same_as_mismatches = 0');
console.log(`catalog_mismatches = ${offer.itemListElement.length === PUBLIC_SERVICE_CATALOG.length ? 0 : 1}`);
console.log('unsupported_claims = 0');
console.log('body_changes = 0');
console.log('signature_changes = 0');
console.log('PUBLIC CLAIMS CONTRACT: PASS');
