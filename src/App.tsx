import Papa from "papaparse";
import React, { useEffect, useState } from "react";
import Confetti from "react-confetti";
import { FaCog } from "react-icons/fa";
import "./index.css";
import { dialog } from "@tauri-apps/api";
import { invoke } from "@tauri-apps/api";
// import { appWindow } from "@tauri-apps/api/window";

interface AppState {
  itemsMap: Record<string, boolean>;
  currentItems: string[];
  isDrawing: boolean;
  selectedItem: string | null;
  isFileUploaded: boolean;
  winners: Record<string, boolean>;
  backgroundUrl: string;
}

function App(): JSX.Element {
  localStorage.removeItem("winners");
  const [state, setState] = useState<AppState>(() => ({
    itemsMap: {},
    currentItems: [],
    isDrawing: false,
    selectedItem: null,
    isFileUploaded: false,
    winners: JSON.parse(localStorage.getItem("winners") || "{}"),
    backgroundUrl: "",
  }));
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const handleKeyDown = async (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        await dialog.ask("Are you sure you want to exit?", "LuckyDraw");
        await invoke("exit_app");
        // await appWindow.close();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (file) {
      try {
        const csvData = await file.text();
        const result = Papa.parse(csvData, {
          header: true,
          skipEmptyLines: true,
        });

        const itemsMap: Record<string, boolean> = {};
        result.data.forEach((row) => {
          itemsMap[row.Name] = false; // Initialize with false
        });

        const eligibleItems = Object.keys(itemsMap);

        setState((prevState) => ({
          ...prevState,
          itemsMap,
          currentItems: eligibleItems,
          isFileUploaded: true,
          showConfetti: false, // Reset confetti state when a new file is uploaded
        }));
      } catch (error) {
        console.error("Error loading CSV:", error);
      }
    }
  };

  const handleBackgroundImageUpload = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (file) {
      const url = URL.createObjectURL(file);

      setState((prevState) => ({
        ...prevState,
        backgroundUrl: url,
      }));
    }
  };

  console.log(state.backgroundUrl);

  useEffect(() => {
    // localStorage.removeItem('winners')
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        toggleRandomDrawing();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    let drawInterval;

    const startDrawAnimation = () => {
      if (!state.selectedItem) {
        const eligibleItems = state.currentItems.filter(
          (item) => !state.winners[item]
        );
        const randomIndex = Math.floor(Math.random() * eligibleItems.length);
        const winner = eligibleItems[randomIndex];

        setState((prevState) => ({
          ...prevState,
          selectedItem: winner,
          showConfetti: false, // Reset confetti state when starting a new draw
        }));
      }

      drawInterval = setInterval(() => {
        const eligibleItems = state.currentItems.filter(
          (item) => !state.winners[item]
        );
        const randomIndex = Math.floor(Math.random() * eligibleItems.length);
        const winner = eligibleItems[randomIndex];

        setState((prevState) => ({
          ...prevState,
          selectedItem: winner,
          showConfetti: false, // Reset confetti state during animation
        }));
      }, 50); // Adjust the interval duration for smoother animation
    };

    const stopDrawAnimation = () => {
      clearInterval(drawInterval);

      if (state.selectedItem) {
        setShowConfetti(true); // Show confetti when the draw stops

        // Update winners in state and local storage
        setState((prevState) => ({
          ...prevState,
          winners: {
            ...prevState.winners,
            [state.selectedItem!]: true,
          },
        }));
        localStorage.setItem("winners", JSON.stringify(state.winners));
      }
    };

    if (state.isDrawing) {
      startDrawAnimation();
    } else {
      stopDrawAnimation();
    }

    return () => {
      clearInterval(drawInterval);
    };
  }, [state.isDrawing, state.currentItems, state.selectedItem, state.winners]);

  const toggleRandomDrawing = () => {
    setState((prevState) => ({
      ...prevState,
      isDrawing: !prevState.isDrawing,
    }));
  };

  const handleButtonClick = () => {
    toggleRandomDrawing();
  };

  return (
    <div
      style={{
        backgroundImage: `url(${state.backgroundUrl})`,
        backgroundSize: "cover",
        display: "flex",
        flexDirection: "column",
        alignItems: "center", // Align items in the center vertically
        justifyContent: "center", // Center content horizontally
        height: "100vh", // Full height of the viewport
      }}
      className="bg-slate-700 text-white font-bold text-6xl"
    >
      <div className="text-center">
        {state.isFileUploaded ? (
          state.isDrawing ? (
            <div className="animate-fadeIn">
              <div className="flex space-y-4 min-w-[1400px] flex-col px-8 py-8 bg-gradient-to-r from-white/5 via-white/15 to-white/5 mt-44 rounded-2xl items-center justify-center">
                <span className="min-h-[100px] text-nowrap">
                  {" "}
                  {state.selectedItem?.split("(")[0]}
                </span>
                <span>
                  {state.selectedItem && "("}
                  {state.selectedItem?.split("(")[1]}
                </span>
              </div>
            </div>
          ) : (
            <React.Fragment>
              {state.selectedItem && (
                <p
                  className="absolute top-[30%] left-1/2 transform -translate-x-1/2 text-white text-6xl font-bold mt-16 font-anta-regular"
                  style={{
                    zIndex: 1,
                  }}
                >
                  Winner
                </p>
              )}
              {showConfetti && (
                <Confetti
                  width={window.innerWidth}
                  height={window.innerHeight}
                  numberOfPieces={500}
                  recycle={false}
                />
              )}
              <p>
                {state.selectedItem ? (
                  <>
                    {" "}
                    <div className="flex space-y-4 min-w-[1400px] flex-col px-8 py-8 bg-gradient-to-r from-white/5 via-white/15 to-white/5 mt-44 rounded-2xl items-center justify-center">
                      <span className="min-h-[100px] text-nowrap">
                        {" "}
                        {state.selectedItem?.split("(")[0]}
                      </span>
                      <span>
                        {state.selectedItem && "("}
                        {state.selectedItem?.split("(")[1]}
                      </span>
                    </div>
                  </>
                ) : (
                  "Press space to start the draw"
                )}
              </p>
            </React.Fragment>
          )
        ) : (
          <div className="flex items-center justify-center">
            <label
              htmlFor="fileUpload"
              className="cursor-pointer border border-white/20 hover:scale-110 transform duration-300 ease-in-out bg-gradient-to-r from-white/5 via-white/15 to-white/5 p-8 rounded-2xl mr-2"
            >
              <p>Upload File</p>
              <input
                id="fileUpload"
                type="file"
                className="hidden"
                accept=".csv"
                onChange={handleFileUpload}
              />
            </label>
            <label
              htmlFor="backgroundImageUpload"
              className="cursor-pointer border border-white/20 hover:scale-110 transform duration-300 ease-in-out bg-gradient-to-r from-white/5 via-white/15 to-white/5 p-8 rounded-full mr-2"
            >
              <p>
                <FaCog />
              </p>
            </label>
            <input
              id="backgroundImageUpload"
              type="file"
              accept="image/*"
              onChange={handleBackgroundImageUpload}
              className="hidden"
            />
          </div>
        )}
      </div>
      <p className="absolute bottom-0 left-0 ml-4 mb-4 text-slate-500 text-sm">
        {state.currentItems.length - Object.keys(state.winners).length}
      </p>
    </div>
  );
}

export default App;
