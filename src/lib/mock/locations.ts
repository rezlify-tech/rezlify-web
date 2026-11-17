/** Matches the Laravel StateCitySeeder. Swapped for the API later. */

export type StateOption = { name: string; slug: string; cities: string[] };

const data: Record<string, string[]> = {
  Abia: ["Umuahia", "Aba", "Ohafia", "Arochukwu"],
  Adamawa: ["Yola", "Jimeta", "Mubi", "Numan"],
  "Akwa Ibom": ["Uyo", "Eket", "Ikot Ekpene", "Oron"],
  Anambra: ["Awka", "Onitsha", "Nnewi", "Ekwulobia"],
  Bauchi: ["Bauchi", "Azare", "Misau", "Jama'are"],
  Bayelsa: ["Yenagoa", "Brass", "Ogbia", "Sagbama"],
  Benue: ["Makurdi", "Gboko", "Otukpo", "Katsina-Ala"],
  Borno: ["Maiduguri", "Biu", "Bama", "Monguno"],
  "Cross River": ["Calabar", "Ikom", "Ogoja", "Ugep"],
  Delta: ["Asaba", "Warri", "Sapele", "Ughelli", "Agbor"],
  Ebonyi: ["Abakaliki", "Afikpo", "Onueke"],
  Edo: ["Benin City", "Auchi", "Ekpoma", "Uromi"],
  Ekiti: ["Ado-Ekiti", "Ikere-Ekiti", "Ijero-Ekiti", "Ise-Ekiti"],
  Enugu: ["Enugu", "Nsukka", "Oji River", "Agbani"],
  "FCT Abuja": ["Garki", "Wuse", "Maitama", "Asokoro", "Gwarinpa", "Kubwa", "Lugbe", "Gwagwalada"],
  Gombe: ["Gombe", "Kumo", "Billiri", "Kaltungo"],
  Imo: ["Owerri", "Orlu", "Okigwe", "Oguta"],
  Jigawa: ["Dutse", "Hadejia", "Kazaure", "Gumel"],
  Kaduna: ["Kaduna", "Zaria", "Kafanchan", "Kagoro"],
  Kano: ["Kano", "Wudil", "Gaya", "Rano"],
  Katsina: ["Katsina", "Daura", "Funtua", "Malumfashi"],
  Kebbi: ["Birnin Kebbi", "Argungu", "Yauri", "Zuru"],
  Kogi: ["Lokoja", "Okene", "Idah", "Kabba", "Anyigba"],
  Kwara: ["Ilorin", "Offa", "Omu-Aran", "Jebba"],
  Lagos: [
    "Ikeja", "Lekki", "Victoria Island", "Ikoyi", "Surulere", "Yaba", "Ajah", "Ikorodu",
    "Festac", "Alimosho", "Oshodi", "Apapa", "Lagos Island", "Ojo", "Epe", "Badagry",
  ],
  Nasarawa: ["Lafia", "Keffi", "Akwanga", "Karu", "Mararaba"],
  Niger: ["Minna", "Bida", "Suleja", "Kontagora"],
  Ogun: ["Abeokuta", "Ijebu-Ode", "Sagamu", "Ota", "Ilaro", "Mowe"],
  Ondo: ["Akure", "Ondo", "Owo", "Ikare", "Okitipupa", "Ore"],
  Osun: ["Osogbo", "Ile-Ife", "Ilesa", "Ede", "Iwo"],
  Oyo: ["Ibadan", "Ogbomoso", "Oyo", "Iseyin", "Saki"],
  Plateau: ["Jos", "Bukuru", "Pankshin", "Shendam"],
  Rivers: ["Port Harcourt", "Obio-Akpor", "Bonny", "Eleme", "Omoku"],
  Sokoto: ["Sokoto", "Tambuwal", "Wurno", "Gwadabawa"],
  Taraba: ["Jalingo", "Wukari", "Bali", "Takum"],
  Yobe: ["Damaturu", "Potiskum", "Gashua", "Nguru"],
  Zamfara: ["Gusau", "Kaura Namoda", "Talata Mafara", "Anka"],
};

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export const states: StateOption[] = Object.entries(data).map(([name, cities]) => ({
  name,
  slug: slugify(name),
  cities,
}));
