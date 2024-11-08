import { Typography, IconButton, Input, Button } from "@material-tailwind/react";

export const TypographyWrapper = ({ children, ...props }) => {
  return <Typography {...props}>{children}</Typography>;
};

export const IconButtonWrapper = ({ children, ...props }) => {
  return <IconButton {...props}>{children}</IconButton>;
};

export const InputWrapper = ({ ...props }) => {
  return <Input {...props} />;
};

export const ButtonWrapper = ({ children, ...props }) => {
  return <Button {...props}>{children}</Button>;
}; 