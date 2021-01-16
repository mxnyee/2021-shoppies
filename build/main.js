"use strict";

const MAX_NOMINATIONS = 5;
const THEMES = [{
  name: "light",
  label: "☀️ Light"
}, {
  name: "dark",
  label: "🌙 Dark"
}, {
  name: "spooky",
  label: "💉 Spooky"
}, {
  name: "fancy",
  label: "👑 Fancy"
}];
const SEARCH_URL = `${"http://www.omdbapi.com/"}?apikey=${"91559dab"}&s=`;

const fetchMovies = async query => {
  const res = await window.fetch(`${SEARCH_URL}${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error(res.statusText);
  const {
    Response: responseOk,
    Error: errorMsg,
    Search: list,
    totalResults: total
  } = await res.json();
  ;
  if (responseOk === "False") throw new Error(errorMsg);
  return {
    list,
    total
  };
}; // Modified from https://levelup.gitconnected.com/debounce-in-javascript-improve-your-applications-performance-5b01855e086


const DEBOUNCE_INTERVAL_MS = 500;

function debounce(func) {
  let timeout; // Wrapper function

  return (...args) => {
    // Executes the original function
    const finish = () => {
      func(...args);
      timeout = null;
    }; // Reset the timer


    clearTimeout(timeout);
    timeout = setTimeout(finish, DEBOUNCE_INTERVAL_MS);
  };
} // Modified from https://dev.to/selbekk/persisting-your-react-state-in-9-lines-of-code-9go


const THEME_STORAGE_KEY = 'shoppies-theme';
const NOMINATIONS_STORAGE_KEY = 'shoppies-nominations';

const usePersistedState = (key, initialState) => {
  const [state, setState] = React.useState(() => {
    const storedState = localStorage.getItem(key);
    return storedState ? JSON.parse(storedState) : initialState;
  });
  React.useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (e) {// Do nothing
    }
  }, [state]);
  return [state, setState];
};

const Search = ({
  query,
  error,
  changeQuery
}) => /*#__PURE__*/React.createElement("section", {
  className: "section search__container"
}, /*#__PURE__*/React.createElement("div", {
  className: "section__header"
}, /*#__PURE__*/React.createElement("h2", null, "Search")), /*#__PURE__*/React.createElement("div", {
  className: "section__body"
}, /*#__PURE__*/React.createElement("form", {
  className: "searchForm",
  onSubmit: e => e.preventDefault()
}, /*#__PURE__*/React.createElement("label", {
  htmlFor: "searchFormInput",
  className: "input__label"
}, "Movie title"), /*#__PURE__*/React.createElement("span", {
  className: "input__wrapper"
}, /*#__PURE__*/React.createElement("input", {
  autoFocus: true,
  id: "searchFormInput",
  className: "input searchForm__input",
  placeholder: "Type to search",
  value: query,
  onChange: e => changeQuery(e.target.value)
}), /*#__PURE__*/React.createElement("button", {
  type: "button",
  disabled: !query,
  className: "button input__clearButton",
  "aria-label": "Clear search",
  onClick: () => changeQuery("")
}, "\xD7")), /*#__PURE__*/React.createElement("span", {
  className: "input__error"
}, error ? `Error: ${error}` : null))));

const ListItem = ({
  listName,
  item,
  button
}) => /*#__PURE__*/React.createElement("li", {
  key: `${listName}-${item.imdbID}`
}, /*#__PURE__*/React.createElement("a", {
  href: `https://www.imdb.com/title/${item.imdbID}/`,
  target: "_blank",
  className: "link list__link"
}, item.Poster !== "N/A" ? /*#__PURE__*/React.createElement("img", {
  src: item.Poster,
  alt: "",
  className: "list__itemImage"
}) : null, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("p", null, item.Title), /*#__PURE__*/React.createElement("p", {
  className: "list__itemSubtext"
}, "(", item.Year, ")"))), button ?? null);

const Results = ({
  done,
  loading,
  results: {
    query,
    list,
    total
  },
  nominations,
  nominateMovie
}) => /*#__PURE__*/React.createElement("section", {
  className: "section results__container"
}, /*#__PURE__*/React.createElement("div", {
  className: "section__header"
}, /*#__PURE__*/React.createElement("h2", null, list.length === 0 ? "Results" : `Results for "${query}"`), /*#__PURE__*/React.createElement("p", null, total || "–", " total results")), /*#__PURE__*/React.createElement("div", {
  className: "section__body"
}, loading ? /*#__PURE__*/React.createElement("div", {
  className: "loading"
}, "Loading...") : /*#__PURE__*/React.createElement("ul", null, list.map(item => /*#__PURE__*/React.createElement(ListItem, {
  listName: "results",
  item: item,
  button: /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "button",
    disabled: done || !!nominations.find(nominated => item.imdbID === nominated.imdbID),
    onClick: () => nominateMovie(item)
  }, "Nominate")
})))));

const Nominations = ({
  nominations,
  removeMovie,
  removeAllMovies
}) => /*#__PURE__*/React.createElement("section", {
  className: "section"
}, /*#__PURE__*/React.createElement("div", {
  className: "section__header"
}, /*#__PURE__*/React.createElement("h2", null, "Nominations"), /*#__PURE__*/React.createElement("button", {
  type: "button",
  className: "button",
  disabled: nominations.length === 0,
  onClick: () => removeAllMovies()
}, "Remove all")), /*#__PURE__*/React.createElement("div", {
  className: "section__body"
}, /*#__PURE__*/React.createElement("ul", null, nominations.map(item => /*#__PURE__*/React.createElement(ListItem, {
  listName: "nomination",
  item: item,
  button: /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "button",
    onClick: () => removeMovie(item)
  }, "Remove")
})))));

const Banner = ({
  show
}) => /*#__PURE__*/React.createElement("section", {
  className: "section"
}, /*#__PURE__*/React.createElement("div", {
  className: `banner ${show ? "" : "banner--hide"}`
}, /*#__PURE__*/React.createElement("p", null, "Limit of ", MAX_NOMINATIONS, " nominations reached.")));

const ThemeButton = ({
  themeIndex,
  setThemeIndex
}) => {
  const currentTheme = THEMES[themeIndex];
  const numThemes = THEMES.length;
  const nextIndex = typeof themeIndex === "number" && themeIndex >= 0 && themeIndex < numThemes ? (themeIndex + 1) % numThemes : 0;
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "button",
    "aria-label": "Change theme",
    onClick: () => setThemeIndex(nextIndex)
  }, currentTheme?.label);
};

const Root = () => {
  const [themeIndex, setThemeIndex] = usePersistedState(THEME_STORAGE_KEY, 0);
  const [query, setQuery] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [results, setResults] = React.useState({
    query: "",
    list: [],
    total: 0
  });
  const [nominations, setNominations] = usePersistedState(NOMINATIONS_STORAGE_KEY, []);
  const done = nominations.length >= MAX_NOMINATIONS;
  React.useEffect(() => {
    document.querySelector("html").className = THEMES[themeIndex]?.name;
  }, [themeIndex]);

  const submitQuery = async value => {
    if (!value) {
      setError("");
      setResults({
        query: "",
        list: [],
        total: 0
      });
      return;
    }

    setLoading(true);

    try {
      const {
        list,
        total
      } = await fetchMovies(value);
      setError("");
      setResults({
        query: value,
        list,
        total
      });
    } catch (e) {
      setError(e.message);
      setResults({
        query: value,
        list: [],
        total: 0
      });
    }

    setLoading(false);
  };

  const submitQueryDebounced = React.useCallback(debounce(submitQuery), []);

  const changeQuery = value => {
    setQuery(value);
    submitQueryDebounced(value);
  };

  const nominateMovie = movie => {
    const newNominations = [...nominations, movie];
    setNominations(newNominations);
  };

  const removeMovie = movie => {
    const newNominations = [...nominations].filter(item => item.imdbID !== movie.imdbID);
    setNominations(newNominations);
  };

  const removeAllMovies = () => {
    setNominations([]);
  };

  return /*#__PURE__*/React.createElement("div", {
    className: "page"
  }, /*#__PURE__*/React.createElement("div", {
    className: "page__header"
  }, /*#__PURE__*/React.createElement("h1", null, "The Shoppies"), /*#__PURE__*/React.createElement(ThemeButton, {
    themeIndex: themeIndex,
    setThemeIndex: setThemeIndex
  })), /*#__PURE__*/React.createElement("div", {
    className: "page__body"
  }, /*#__PURE__*/React.createElement(Search, {
    query: query,
    loading: loading,
    error: error,
    changeQuery: changeQuery,
    submitQuery: submitQuery
  }), /*#__PURE__*/React.createElement(Results, {
    done: done,
    loading: loading,
    results: results,
    nominations: nominations,
    nominateMovie: nominateMovie
  }), /*#__PURE__*/React.createElement(Nominations, {
    nominations: nominations,
    removeMovie: removeMovie,
    removeAllMovies: removeAllMovies
  })), /*#__PURE__*/React.createElement(Banner, {
    show: done
  }));
};

const domContainer = document.querySelector("#root");
ReactDOM.render( /*#__PURE__*/React.createElement(Root, null), domContainer);