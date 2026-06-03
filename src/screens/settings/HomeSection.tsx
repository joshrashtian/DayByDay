import { useSettings } from "../../providers/SettingsProvider";

export default function HomeSection() {
  const { navigate } = useSettings();
  return (
    <div>
      <input type="text" placeholder="" />
      <section className="grid grid-cols-4 grid-rows-3">
        <div className="col-span-1 row-span-1">Weather</div>
      </section>
      <button onClick={() => navigate("")}></button>
    </div>
  );
}
