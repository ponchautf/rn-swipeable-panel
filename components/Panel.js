import React, { Component } from "react";
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableHighlight,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
  PanResponder,
} from "react-native";

import { Bar } from "./Bar";
import { Close } from "./Close";

import PropTypes from "prop-types";

const FULL_HEIGHT = Dimensions.get("window").height;
const FULL_WIDTH = Dimensions.get("window").width;
const PANEL_HEIGHT = FULL_HEIGHT - 100;

const STATUS = {
  CLOSED: 0,
  SMALL: 1,
  LARGE: 2,
};

class SwipeablePanel extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isActive: false,
      showComponent: false,
      opacity: new Animated.Value(0),
      canScroll: false,
      status: STATUS.CLOSED,
      pan: new Animated.ValueXY({ x: 0, y: FULL_HEIGHT }),
    };

    this.pan = new Animated.ValueXY({ x: 0, y: FULL_HEIGHT });
    this.isClosing = false;
    this.animatedValueY = 0;

    this._panResponder = PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => true,
      onPanResponderGrant: (evt, gestureState) => {
        this.state.pan.setOffset({
          x: 0,
          y: this.animatedValueY,
        });
        this.state.pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (evt, gestureState) => {
        if (
          (this.state.status == 1 &&
            Math.abs(this.state.pan.y._value) <= this.state.pan.y._offset) ||
          (this.state.status == 2 && this.state.pan.y._value > -1)
        )
          this.state.pan.setValue({
            x: 0,
            y: gestureState.dy,
          });
      },
      onPanResponderRelease: (evt, gestureState) => {
        const { onlyLarge, onlySmall } = this.props;
        this.state.pan.flattenOffset();

        if (gestureState.dy == 0) {
          this._animateTo(this.state.status);
        } else if (gestureState.dy < -100 || gestureState.vy < -0.5) {
          if (this.state.status == STATUS.SMALL) {
            this._animateTo(onlySmall ? STATUS.SMALL : STATUS.LARGE);
          } else this._animateTo(STATUS.LARGE);
        } else if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          if (this.state.status == STATUS.LARGE)
            this._animateTo(onlyLarge ? STATUS.CLOSED : STATUS.SMALL);
          else this._animateTo(0);
        } else {
          this._animateTo(this.state.status);
        }
      },
    });
  }

  componentDidMount = () => {
    const { isActive, openLarge, onlyLarge, onlySmall } = this.props;

    this.animatedValueY = 0;
    this.state.pan.y.addListener(
      (value) => (this.animatedValueY = value.value)
    );

    this.setState({ isActive });

    if (isActive) {
      this._animateTo(
        onlySmall
          ? STATUS.SMALL
          : openLarge
          ? STATUS.LARGE
          : onlyLarge
          ? STATUS.LARGE
          : STATUS.SMALL
      );
    }
  };

  componentDidUpdate(prevProps, prevState) {
    const { isActive, openLarge, onlyLarge, onlySmall } = this.props;
    if (onlyLarge && onlySmall)
      console.warn(
        "Ops. You are using both onlyLarge and onlySmall options. onlySmall will override the onlyLarge in this situation. Please select one of them or none."
      );

    if (prevProps.isActive !== isActive) {
      this.setState({ isActive });

      if (isActive)
        this._animateTo(
          onlySmall
            ? STATUS.SMALL
            : openLarge
            ? STATUS.LARGE
            : onlyLarge
            ? STATUS.LARGE
            : STATUS.SMALL
        );
      else this._animateTo();
    }
  }

  _animateTo = (newStatus = 0) => {
    let newY = 0;

    if (newStatus == 0) {
      newY = PANEL_HEIGHT;
    } else if (newStatus == 1) newY = FULL_HEIGHT - 400;
    else if (newStatus == 2) newY = 0;

    this.setState({
      showComponent: true,
      status: newStatus,
    });

    Animated.spring(this.state.pan, {
      toValue: { x: 0, y: newY },
      tension: 80,
      friction: 25,
      useNativeDriver: true,
      restDisplacementThreshold: 10,
      restSpeedThreshold: 10,
    }).start(() => {
      if (newStatus == 0) {
        this.props.onClose();
        this.setState({
          showComponent: false,
        });
      } else this.setState({ canScroll: newStatus == 2 ? true : false });
    });
  };

  render() {
    const { showComponent } = this.state;
    const {
      allowTouchOutside,
      noBackgroundOpacity,
      style,
      closeRootStyle,
      closeIconStyle,
      barStyle,
    } = this.props;

    return showComponent ? (
      <Animated.View
        style={[
          SwipeablePanelStyles.background,
          {
            backgroundColor: noBackgroundOpacity
              ? "rgba(0,0,0,0)"
              : "rgba(0,0,0,0.5)",
          },
          {
            height: allowTouchOutside ? "auto" : FULL_HEIGHT,
          },
        ]}
      >
        {this.props.closeOnTouchOutside && (
          <TouchableWithoutFeedback onPress={this.props.onClose}>
            <View
              style={[
                SwipeablePanelStyles.background,
                {
                  backgroundColor: "rgba(0,0,0,0)",
                  height: allowTouchOutside ? "auto" : FULL_HEIGHT,
                },
              ]}
            />
          </TouchableWithoutFeedback>
        )}
        <Animated.View
          style={[
            SwipeablePanelStyles.panel,
            { width: this.props.fullWidth ? FULL_WIDTH : FULL_WIDTH - 50 },
            { transform: this.state.pan.getTranslateTransform() },
            style,
          ]}
          {...this._panResponder.panHandlers}
        >
          {!this.props.noBar && <Bar barStyle={barStyle} />}
          {this.props.showCloseButton && (
            <Close
              rootStyle={closeRootStyle}
              iconStyle={closeIconStyle}
              onPress={this.props.onClose}
            />
          )}
          <ScrollView
            onTouchStart={() => {
              return false;
            }}
            onTouchEnd={() => {
              return false;
            }}
            contentContainerStyle={
              SwipeablePanelStyles.scrollViewContentContainerStyle
            }
          >
            {this.state.canScroll ? (
              <TouchableHighlight>
                <React.Fragment>{this.props.children}</React.Fragment>
              </TouchableHighlight>
            ) : (
              this.props.children
            )}
          </ScrollView>
        </Animated.View>
      </Animated.View>
    ) : null;
  }
}

SwipeablePanel.propTypes = {
  isActive: PropTypes.bool.isRequired,
  onClose: PropTypes.func,
  showCloseButton: PropTypes.bool,
  fullWidth: PropTypes.bool,
  noBackgroundOpacity: PropTypes.bool,
  style: PropTypes.object,
  closeRootStyle: PropTypes.object,
  closeIconStyle: PropTypes.object,
  closeOnTouchOutside: PropTypes.bool,
  allowTouchOutside: PropTypes.bool,
  onlyLarge: PropTypes.bool,
  onlySmall: PropTypes.bool,
  openLarge: PropTypes.bool,
  barStyle: PropTypes.object,
  noBar: PropTypes.bool,
};

SwipeablePanel.defaultProps = {
  style: {},
  onClose: () => {},
  fullWidth: true,
  closeRootStyle: {},
  closeIconStyle: {},
  openLarge: false,
  onlyLarge: false,
  onlySmall: false,
  showCloseButton: false,
  noBar: false,
  closeOnTouchOutside: false,
  allowTouchOutside: false,
  barStyle: {},
};

const SwipeablePanelStyles = StyleSheet.create({
  background: {
    position: "absolute",
    zIndex: 1,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    width: FULL_WIDTH,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  panel: {
    position: "absolute",
    height: PANEL_HEIGHT,
    width: FULL_WIDTH - 50,
    transform: [{ translateY: FULL_HEIGHT - 100 }],
    display: "flex",
    flexDirection: "column",
    backgroundColor: "white",
    bottom: 0,
    borderRadius: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
    zIndex: 2,
  },
  scrollViewContentContainerStyle: {
    width: "100%",
  },
});

export default SwipeablePanel;
export const SMALL_PANEL_CONTENT_HEIGHT =
  PANEL_HEIGHT - (FULL_HEIGHT - 400) - 25;
export const LARGE_PANEL_CONTENT_HEIGHT = PANEL_HEIGHT - 25;
