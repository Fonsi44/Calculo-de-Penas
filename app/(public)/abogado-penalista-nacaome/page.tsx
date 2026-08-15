import { CargoLandingView } from '@/components/marketing/cargo-landing';
import { cargoMetadata, getCargoByPath } from '@/data/landings-cargo';

const cargo = getCargoByPath('/abogado-penalista-nacaome');

export const metadata = cargoMetadata(cargo);

export default function AbogadoPenalistaNacaomePage() {
  return <CargoLandingView cargo={cargo} />;
}
