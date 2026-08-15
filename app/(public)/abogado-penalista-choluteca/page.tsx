import { CargoLandingView } from '@/components/marketing/cargo-landing';
import { cargoMetadata, getCargoByPath } from '@/data/landings-cargo';

const cargo = getCargoByPath('/abogado-penalista-choluteca');

export const metadata = cargoMetadata(cargo);

export default function AbogadoPenalistaCholutecaPage() {
  return <CargoLandingView cargo={cargo} />;
}
