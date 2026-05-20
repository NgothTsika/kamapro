declare module "react-native-confetti" {
  import { Component } from "react";
  import { ViewProps } from "react-native";

  interface ConfettiProps extends ViewProps {
    ref?: React.Ref<Confetti>;
  }

  export default class Confetti extends Component<ConfettiProps> {
    shake(): void;
  }
}
