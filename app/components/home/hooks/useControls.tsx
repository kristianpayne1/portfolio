import { useCallback, useContext, createContext, useReducer } from "react";
import type { Dispatch } from "react";
import { Color } from "three";

export type Theme =
    | "original"
    | "january"
    | "february"
    | "march"
    | "april"
    | "may"
    | "june"
    | "july"
    | "august"
    | "september"
    | "october"
    | "november"
    | "december";

export type ControlsContext = {
    open: boolean;
    setOpen: Dispatch<boolean>;
    theme: Theme;
    setTheme: Dispatch<Theme>;
    color: Color;
    setColor: Dispatch<Color>;
    resolution: number;
    setResolution: Dispatch<number>;
    length: number;
    setLength: Dispatch<number>;
    brightness: number;
    setBrightness: Dispatch<number>;
    opacity: number;
    setOpacity: Dispatch<number>;
    reset: () => void;
};

type ControlsState = {
    open: boolean;
    theme: Theme;
    color: Color;
    resolution: number;
    length: number;
    brightness: number;
    opacity: number;
};

type ControlsAction =
    | { type: "SET_OPEN"; payload: boolean }
    | { type: "SET_THEME"; payload: Theme }
    | { type: "SET_COLOR"; payload: Color }
    | { type: "SET_RESOLUTION"; payload: number }
    | { type: "SET_LENGTH"; payload: number }
    | { type: "SET_FLOW_SPEED"; payload: number }
    | { type: "SET_BRIGHTNESS"; payload: number }
    | { type: "SET_OPACITY"; payload: number }
    | { type: "RESET" };

const getDefaultOpen = () =>
    typeof window === "undefined"
        ? true
        : !window.matchMedia("(max-width: 639px)").matches;

const createInitialState = (): ControlsState => ({
    open: getDefaultOpen(),
    theme: "original",
    color: new Color("#fff"),
    resolution: 128,
    length: 1.0,
    brightness: 1.0,
    opacity: 0.5,
});

function controlsReducer(
    state: ControlsState,
    action: ControlsAction,
): ControlsState {
    switch (action.type) {
        case "SET_OPEN":
            return { ...state, open: action.payload };
        case "SET_THEME":
            return { ...state, theme: action.payload };
        case "SET_COLOR":
            return { ...state, color: action.payload };
        case "SET_RESOLUTION":
            return { ...state, resolution: action.payload };
        case "SET_LENGTH":
            return { ...state, length: action.payload };
        case "SET_BRIGHTNESS":
            return { ...state, brightness: action.payload };
        case "SET_OPACITY":
            return { ...state, opacity: action.payload };
        case "RESET":
            return createInitialState();
        default:
            return state;
    }
}

const context = createContext<ControlsContext | null>(null);

function useControls() {
    const controls = useContext(context);

    if (!controls) {
        throw new Error("useControls must be used within a ControlsProvider");
    }

    return controls;
}

export function ControlsProvider({ children }: { children: React.ReactNode }) {
    const [
        { open, theme, color, resolution, length, brightness, opacity },
        dispatch,
    ] = useReducer(controlsReducer, createInitialState());

    const setOpen: Dispatch<boolean> = (value: boolean) => {
        dispatch({
            type: "SET_OPEN",
            payload: value,
        });
    };

    const setTheme: Dispatch<Theme> = (value: Theme) => {
        dispatch({
            type: "SET_THEME",
            payload: value,
        });
    };

    const setColor: Dispatch<Color> = (value: Color) => {
        dispatch({
            type: "SET_COLOR",
            payload: value,
        });
    };

    const setResolution: Dispatch<number> = (value: number) => {
        dispatch({
            type: "SET_RESOLUTION",
            payload: value,
        });
    };

    const setLength: Dispatch<number> = (value: number) => {
        dispatch({
            type: "SET_LENGTH",
            payload: value,
        });
    };

    const setBrightness: Dispatch<number> = useCallback((value: number) => {
        dispatch({
            type: "SET_BRIGHTNESS",
            payload: value,
        });
    }, []);

    const setOpacity: Dispatch<number> = useCallback((value: number) => {
        dispatch({
            type: "SET_OPACITY",
            payload: value,
        });
    }, []);

    const reset = () => dispatch({ type: "RESET" });

    return (
        <context.Provider
            value={{
                open,
                setOpen,
                theme,
                setTheme,
                color,
                setColor,
                resolution,
                setResolution,
                length,
                setLength,
                brightness,
                setBrightness,
                opacity,
                setOpacity,
                reset,
            }}
        >
            {children}
        </context.Provider>
    );
}

export default useControls;
