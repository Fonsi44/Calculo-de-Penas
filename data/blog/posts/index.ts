import type { Post } from '../types';
import { defensaPenalHonduras } from './defensa-penal-honduras';
import { abogadoPenalistaSurHonduras } from './abogado-penalista-sur-honduras';
import { problemasLegalesFamiliaresHonduras } from './problemas-legales-familiares-honduras';
import { despidoLaboralHondurasDerechos } from './despido-laboral-honduras-derechos';
import { elegirBufeteAbogadosNacaome } from './elegir-bufete-abogados-nacaome';
import { serviciosLegalesEmpresasSurHonduras } from './servicios-legales-empresas-sur-honduras';

export const posts: Post[] = [
  defensaPenalHonduras,
  abogadoPenalistaSurHonduras,
  problemasLegalesFamiliaresHonduras,
  despidoLaboralHondurasDerechos,
  elegirBufeteAbogadosNacaome,
  serviciosLegalesEmpresasSurHonduras,
];
