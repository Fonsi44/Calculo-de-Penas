import { CargoLandingView } from '@/components/marketing/cargo-landing';
import { cargoMetadata, getCargoByPath } from '@/data/landings-cargo';

const cargo = getCargoByPath('/abogado-de-familia-nacaome');

export const metadata = cargoMetadata(cargo);

export default function AbogadoDeFamiliaNacaomePage() {
  return <CargoLandingView cargo={cargo} />;
}
