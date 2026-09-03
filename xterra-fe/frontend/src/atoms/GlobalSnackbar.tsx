import { Alert, Snackbar } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { hideToast } from "../store/toastSlice";

const GlobalSnackbar = () => {
  const dispatch = useDispatch();

  const { open, message, severity } = useSelector((state: any) => state.toast);

  return (
    <Snackbar
      open={open}
      autoHideDuration={3000}
      onClose={() => dispatch(hideToast())}
      anchorOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
    >
      <Alert severity={severity} onClose={() => dispatch(hideToast())}>
        {message}
      </Alert>
    </Snackbar>
  );
};

export default GlobalSnackbar;
