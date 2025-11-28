import AppLayout from "../../components/layout/AppLayout";
import { NavLink } from "react-router-dom";

export default function DishesList() {
  return (
    <AppLayout title="GESTIONE PIATTI" username="Antonio">
      <h1 className="text-3xl font-bold">Elenco piatti</h1>
      <p>Elenco dei piatti qui.</p>
      <NavLink 
        to={`/dishes/edit/18`}
        className="px-3 py-1 bg-brand-primary text-white rounded-md hover:bg-brand-primaryHover transition"
      >
        Modifica
      </NavLink>
    </AppLayout>
  );
}