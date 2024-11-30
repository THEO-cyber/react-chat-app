import React from "react";
import ReactDOM  from "react-dom/client";
import "./Assets/global.css";
import {Provider} from "react-redux"
import {store} from "./Redux/store"
import App from "./App";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";


ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <Provider store={store}>
    <App />
    <ToastContainer
        position="top-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
   />
  </Provider>
);