// Función que aleatoriza los elementos de un array
export const shuffleArray = (a) => a.sort(() => Math.random() - 0.5);

// Función que escoge un elemento aleatorio de un array
export const randomItem = (a) => a[Math.floor(Math.random() * a.length)];

// Función que hace una petición GET a una url
export async function getData(url) {
  const response = await fetch(url);
  const data = await response.json();
  return data;
}
