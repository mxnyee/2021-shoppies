"use strict";

const MAX_NOMINATIONS = 5;
const THEMES = [
    { name: "light", label: "☀️ Light" },
    { name: "dark", label: "🌙 Dark" },
    { name: "spooky", label: "💉 Spooky" },
    { name: "fancy", label: "👑 Fancy" }
];

const SEARCH_URL = `${process.env.BASE_URL}?apikey=${process.env.API_KEY}&s=`
const fetchMovies = async (query) => {
    const res = await window.fetch(`${SEARCH_URL}${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error(res.statusText);
    const { Response: responseOk, Error: errorMsg, Search: list, totalResults: total } = await res.json();;
    if (responseOk === "False") throw new Error(errorMsg);
    return { list, total };
}

// Modified from https://levelup.gitconnected.com/debounce-in-javascript-improve-your-applications-performance-5b01855e086
const DEBOUNCE_INTERVAL_MS = 500;
function debounce(func) {
    let timeout;
    // Wrapper function
    return (...args) => {
        // Executes the original function
        const finish = () => {
            func(...args);
            timeout = null;
        }
        // Reset the timer
        clearTimeout(timeout);
        timeout = setTimeout(finish, DEBOUNCE_INTERVAL_MS);
    }
}

// Modified from https://dev.to/selbekk/persisting-your-react-state-in-9-lines-of-code-9go
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
        } catch (e) {
            // Do nothing
        }
    }, [state]);

    return [state, setState];
};



const Search = ({ query, error, changeQuery }) => (
    <section className="section search__container">
        <div className="section__header">
            <h2>Search</h2>
        </div>
        <div className="section__body">
            <form className="searchForm" onSubmit={(e) => e.preventDefault()}>
                <label htmlFor="searchFormInput" className="input__label">Movie title</label>
                <span className="input__wrapper">
                    <input autoFocus
                        id="searchFormInput"
                        className="input searchForm__input"
                        placeholder="Type to search"
                        value={query}
                        onChange={(e) => changeQuery(e.target.value)} />
                    <button
                        type="button"
                        disabled={!query}
                        className="button input__clearButton"
                        aria-label="Clear search"
                        onClick={() => changeQuery("")}>
                    &times;
                    </button>
                </span>
                <span className="input__error">{error ? `Error: ${error}` : null}</span>
            </form>
        </div>
    </section>
);

const ListItem = ({ listName, item, button }) => (
    <li key={`${listName}-${item.imdbID}`}>
        <a href={`https://www.imdb.com/title/${item.imdbID}/`} target="_blank" className="link list__link">
            {
                (item.Poster !== "N/A")
                    ? <img src={item.Poster} alt="" className="list__itemImage" />
                    : null
            }
            <span>
                <p>{item.Title}</p>
                <p className="list__itemSubtext">({item.Year})</p>
            </span>
        </a>
        {button ?? null}
    </li>
)

const Results = ({ done, loading, results: { query, list, total }, nominations, nominateMovie }) => (
    <section className="section results__container">
        <div className="section__header">
            <h2>
                {list.length === 0
                    ? "Results"
                    : `Results for "${query}"`
                }
            </h2>
            <p>{total || "–"} total results</p>
        </div>
        <div className="section__body">
            {loading
                ? <div className="loading">Loading...</div>
                : (
                    <ul>
                        {list.map((item) => (
                            <ListItem
                                listName="results"
                                item={item}
                                button={
                                    <button
                                        type="button"
                                        className="button"
                                        disabled={done || !!nominations.find((nominated) => item.imdbID === nominated.imdbID)}
                                        onClick={() => nominateMovie(item)}>
                                    Nominate
                                    </button>
                                } />
                        ))} 
                    </ul>
            )}
        </div>
    </section>
);

const Nominations = ({ nominations, removeMovie, removeAllMovies }) => (
    <section className="section">
        <div className="section__header">
            <h2>Nominations</h2>
            <button
                type="button"
                className="button"
                disabled={nominations.length === 0}
                onClick={() => removeAllMovies()}>
            Remove all
            </button>
        </div>
        <div className="section__body">
            <ul>
                {nominations.map((item) => (
                    <ListItem
                        listName="nomination"
                        item={item}
                        button={
                            <button
                                type="button"
                                className="button"
                                onClick={() => removeMovie(item)}>
                            Remove
                            </button>
                        } />
                ))}
            </ul>
        </div>
    </section>
);

const Banner = ({ show }) => (
    <section className="section">
        <div className={`banner ${show ? "" : "banner--hide"}`}>
            <p>Limit of {MAX_NOMINATIONS} nominations reached.</p>
        </div>
    </section>
)

const ThemeButton = ({ themeIndex, setThemeIndex }) => {
    const currentTheme = THEMES[themeIndex];
    const numThemes = THEMES.length;
    const nextIndex = (typeof themeIndex === "number" && themeIndex >= 0 && themeIndex < numThemes)
        ? (themeIndex + 1) % numThemes
        : 0;
    
    return (
        <button
            type="button"
            className="button"
            aria-label="Change theme"
            onClick={() => setThemeIndex(nextIndex)}>
        {currentTheme?.label}
        </button>
    );
}

const Root = () => {
    const [themeIndex, setThemeIndex] = usePersistedState(THEME_STORAGE_KEY, 0);
    const [query, setQuery] = React.useState("");
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState("");
    const [results, setResults] = React.useState({ query: "", list: [], total: 0 });
    const [nominations, setNominations] = usePersistedState(NOMINATIONS_STORAGE_KEY, []);
    const done = nominations.length >= MAX_NOMINATIONS;

    React.useEffect(() => {
        document.querySelector("html").className = THEMES[themeIndex]?.name;
    }, [themeIndex]);

    const submitQuery = async (value) => {
        if (!value) {
            setError("");
            setResults({ query: "", list: [], total: 0 });
            return;
        }
        setLoading(true);
        try {
            const { list, total } = await fetchMovies(value);
            setError("");
            setResults({ query: value, list, total });
        } catch (e) {
            setError(e.message);
            setResults({ query: value, list: [], total: 0 });
        }
        setLoading(false);
    };

    const submitQueryDebounced = React.useCallback(debounce(submitQuery), []);

    const changeQuery = (value) => {
        setQuery(value);
        submitQueryDebounced(value);
    }

    const nominateMovie = (movie) => {
        const newNominations = [...nominations, movie];
        setNominations(newNominations);
    }

    const removeMovie = (movie) => {
        const newNominations = [...nominations].filter((item) => item.imdbID !== movie.imdbID);
        setNominations(newNominations);
    }

    const removeAllMovies = () => {
        setNominations([]);
    }

    return (
        <div className="page">
            <div className="page__header">
                <h1>The Shoppies</h1>
                <ThemeButton themeIndex={themeIndex} setThemeIndex={setThemeIndex} />
            </div>
            <div className="page__body">
                <Search query={query} loading={loading} error={error} changeQuery={changeQuery} submitQuery={submitQuery} />
                <Results done={done} loading={loading} results={results} nominations={nominations} nominateMovie={nominateMovie} />
                <Nominations nominations={nominations} removeMovie={removeMovie} removeAllMovies={removeAllMovies} />
            </div>
            <Banner show={done} />
        </div>
    );
}

const domContainer = document.querySelector("#root");
ReactDOM.render(<Root />, domContainer);
