import { CargoLandingView } from '@/components/marketing/cargo-landing';
import { cargoMetadata, getCargoByPath } from '@/data/landings-cargo';

const cargo = getCargoByPath('/abogado-laboralista-nacaome');

export const metadata = cargoMetadata(cargo);

export default function AbogadoLaboralistaNacaomePage() {
  return <CargoLandingView cargo={cargo} />;
}
