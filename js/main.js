import { getData, shuffleArray, randomItem } from "/js/helpers.js";

const STATE = {
  points: 0,
  articles: [],
};

const HIDDENTEXT = "█████████████";

// Elementos HTML
const points = document.querySelector("#points");
const quiz = document.querySelector("#quiz");

// Esta función lista las categorías a las que pertenece un artículo de la wikipedia
async function getArticleCategories(article) {
  const data = await getData(
    `https://es.wikipedia.org/w/api.php?format=json&origin=*&action=query&prop=categories&titles=${article}`
  );

  const key = Object.keys(data.query.pages)[0];

  const categories = data.query.pages[key].categories
    .map((category) => category.title)
    .filter((category) => !category.includes("Wikipedia"));

  return categories;
}

// Esta función lista los artículos de una categoría de la wikipedia (excluyendo el que se pasa por parámetro)
async function getCategoryArticles(category, exclude) {
  //
  const data = await getData(
    `https://es.wikipedia.org/w/api.php?format=json&origin=*&action=query&list=categorymembers&cmlimit=500&cmtitle=${category}`
  );

  const articles = data.query.categorymembers
    .filter(
      (article) => !article.title.includes(":") && article.title !== exclude
    )
    .map((article) => article.title);

  return articles;
}

// Esta función construye una pregunta con su pista, respuesta y opciones
async function generateQuestion() {
  quiz.innerHTML = "Cargando...";
  try {
    // Coge un artículo al azar de STATE.articles
    const answer = randomItem(STATE.articles);

    // Extrae el título y el resumen de ese artículo de la API

    const { title, extract } = await getData(
      `https://es.wikipedia.org/api/rest_v1/page/summary/${answer}`
    );

    // Oculta las palabras del resumen que coincidan con el título

    const regex = new RegExp(title, "ig");
    const clue = extract.replaceAll(regex, HIDDENTEXT);

    // Si no ocultó ninguna palabra genera un error
    if (!clue.includes(HIDDENTEXT)) {
      throw new Error("Cannot find title in extract");
    }

    // Busca las categorías del artículo escogido
    const categories = await getArticleCategories(answer);

    // Escoge una categoría
    const chosenCategory = randomItem(categories);

    // Busca otros artículos en esa categoría
    const falseOptions = await getCategoryArticles(chosenCategory, title);

    // Si falseOptions tiene menos de 3 artículos volvemos a generar la pregunta

    if (falseOptions.length < 3) {
      throw new Error("Not enought false options");
    }

    // Escogemos 3 opciones al azar
    const options = shuffleArray(falseOptions).slice(0, 3);

    // Creamos el objeto que define a la pregunta
    const question = {
      clue: clue,
      answer: title,
      options: shuffleArray([...options, title]),
    };

    // Escribimos la pregunta en el HTML
    writeQuestion(question);
  } catch (error) {
    // Si algo da error en el código del try volvemos a intentar crear la pregunta
    console.error(error);
    generateQuestion();
  }
}

// Esta función se encarga de escribir una pregunta en el HTML
function writeQuestion(question) {
  // Borrar el contenido de la pregunta actual si la hay
  quiz.innerHTML = "";

  // Actualiza los puntos
  points.innerText = STATE.points;

  // Escribimos la pista
  const clue = document.createElement("p");
  clue.innerText = question.clue;

  quiz.append(clue);

  // Escribimos las respuestas
  for (const answer of question.options) {
    // Creamos el botón de respuesta
    const answerButton = document.createElement("button");
    answerButton.innerText = answer;

    // Gestionamos el evento click del botón
    answerButton.onclick = () => {
      if (answer === question.answer) {
        // Si el botón contiene la respuesta correcta:
        alert("Muy bien!!");
        STATE.points++;
      } else {
        // Si no es el botón correcto
        alert("Fallaste, vuelves a empezar!");
        STATE.points = 0;
      }

      // Sea como sea generamos la siguiente pregunta
      generateQuestion();
    };

    // Añadimos el botón de respuesta al elemento HTML
    quiz.append(answerButton);
  }
}

// Esta función carga la lista inicial de preguntas
async function start() {
  try {
    // Creamos una fecha del día de ayer
    const yesterday = new Date(Date.now() - 86400000);

    // Extraemos el día mes y año (añadiendo al día y mes ceros antes si es necesario)
    const year = yesterday.getFullYear();
    const month = String(yesterday.getMonth() + 1).padStart(2, "0");
    const day = String(yesterday.getDate()).padStart(2, "0");

    // Extraemos los 1000 artículos más visitados de la wikipedia en el día de ayer
    const data = await getData(
      `https://wikimedia.org/api/rest_v1/metrics/pageviews/top/es.wikipedia.org/all-access/${year}/${month}/${day}`
    );

    // Eliminamos los artículos que tenga ":" en el título (son artículos internos de la wikipedia como la página principal o el buscador)
    const validArticles = data.items[0].articles.filter(
      (item) => !item.article.includes(":")
    );

    // Creamos un array con solo el título de los artículos extraidos
    const articles = validArticles.map((item) => item.article);

    // Guardamos los artículos en un objeto global
    STATE.articles = articles;

    console.log(STATE);

    // Generamos la primera pregunta
    generateQuestion();
  } catch (error) {
    alert(
      "desactiva el adblock para jugar (no hay publi, es un falso positivo)"
    );
  }
}

start();
