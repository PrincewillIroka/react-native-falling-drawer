import React, { Component } from "react";
import { Dimensions, TouchableOpacity, Text, Platform } from "react-native";
import View from "react-native-view";
import PropTypes from "prop-types";
import MAIcon from "react-native-vector-icons/MaterialIcons";
import _ from "lodash";
import * as Animatable from "react-native-animatable";
const { width, height } = Dimensions.get("window");

const HEADER_HEIGHT = Platform.select({
  ios: 60,
  android: 50,
});

export default class FallingDrawer extends Component {
  state = {
    screens: [],
    opened: false,
    selectedScreen: null,
    activeScreenDetails: null,
  };

  UNSAFE_componentWillMount() {
    const { screens } = this.props;
    if (!screens || screens.length == 0) {
      return;
    }
    this.optionViews = {};
    this.setState(() => ({ screens, selectedScreen: screens[0] }));
  }

  componentDidUpdate(prevProps, prevState) {
    if (!_.isEqual(this.state.selectedScreen, prevState.selectedScreen)) {
      const latestSelectedScreen = this.state.selectedScreen;
      this.props.setSelectedScreen(latestSelectedScreen);
    }

    if (
      _.has(this.props.activeScreenDetails, "key") &&
      !_.isEqual(this.props.activeScreenDetails, prevProps.activeScreenDetails)
    ) {
      const { key: activeScreenKey, name: activeScreenName } =
        this.props.activeScreenDetails;
      const screens = this.state.screens.map((screen) => {
        let { key } = screen;
        if (key == activeScreenKey) {
          screen["name"] = activeScreenName;
        }
        return screen;
      });
      const selectedScreen = screens[0];
      this.setState(() => ({ screens, selectedScreen }));
    }
  }

  open = async () => {
    const { screens } = this.state;
    const {
      optionCollapseSpeed,
      optionCollapseDelay,
      setIsNavDrawerOpen = () => {},
    } = this.props;
    setIsNavDrawerOpen(true);

    await Promise.all([
      this.optionViews["drawer"].transitionTo(
        {
          top: 0,
        },
        optionCollapseSpeed,
        "linear"
      ),
      this.optionViews[screens[0].key].transitionTo(
        {
          top: 0,
        },
        optionCollapseSpeed,
        "linear"
      ),
    ]);
    for (var i = 1; i < screens.length; i++) {
      const index = i;
      setTimeout(
        () => this.animateFallingOption(index),
        optionCollapseDelay * i
      );
    }
  };

  close = async () => {
    const { screens } = this.state;
    const { setIsNavDrawerOpen = () => {} } = this.props;
    setIsNavDrawerOpen(false);

    await this.optionViews["drawer"].transitionTo({
      top: -height,
    });
    for (var i = 0; i < screens.length; i++) {
      this.optionViews[screens[i].key].transitionTo(
        {
          top: -height,
        },
        1
      );
    }
  };

  animateFallingOption = async (i) => {
    const { screens } = this.state;
    const { diversifyAnimations, optionCollapseSpeed } = this.props;
    const optionHeight = height / screens.length;
    const key = screens[i].key;
    await this.optionViews[key].transitionTo(
      {
        top: -optionHeight * i,
      },
      optionCollapseSpeed
    );
    if (diversifyAnimations) {
      this.diversifyAnimations(key, i);
    } else {
      this.shake(key, i);
    }
  };

  diversifyAnimations = (key, i) => {
    const { shakeDuration } = this.props;
    const timing = shakeDuration - 90 * i;
    if ((i + 1) % 3 === 0) {
      this.optionViews[key].swing(timing);
    } else if ((i + 1) % 2 === 0) {
      this.optionViews[key].shake(timing);
    } else {
      this.optionViews[key].bounce(timing);
    }
  };

  shake = (key, i) => {
    const { shakeDuration } = this.props;
    const timing = shakeDuration - 90 * i;
    this.optionViews[key].shake(timing);
  };

  onSelectScreen = (screen) => {
    this.close().then(() => {
      this.setState(() => ({ selectedScreen: screen }));
    });
  };

  renderScreen = (screen) => {
    const { screens } = this.state;
    const optionHeight = height / screens.length;
    return (
      <Animatable.View
        ref={(view) => (this.optionViews[screen.key] = view)}
        key={screen.key}
        style={{
          position: "absolute",
          top: -height,
          left: -width / 4,
          height: height,
          width: width + width / 2,
          backgroundColor: screen.color,
        }}
      >
        <TouchableOpacity
          style={{ flex: 1 }}
          onPress={() => this.onSelectScreen(screen)}
        >
          <View flex />
          <View style={{ height: optionHeight }}>
            {screen.customHeader ? (
              screen.customHeader()
            ) : (
              <View flex vcenter hcenter>
                <Text
                  style={{
                    color: screen.titleColor || "#FFF",
                    marginTop: 12,
                    fontSize: 18,
                    marginTop: Platform.OS == "ios" ? 15 : 5,
                    fontWeight: "bold"
                  }}
                >
                  {screen.name}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Animatable.View>
    );
  };

  render() {
    const { screens, selectedScreen } = this.state;
    const { headerHeight } = this.props;
    if (screens.length == 0) {
      return null;
    }
    return (
      <View flex>
        {selectedScreen.render()}
        <Animatable.View
          ref={(view) => (this.optionViews["drawer"] = view)}
          style={{
            backgroundColor: selectedScreen.color,
            position: "absolute",
            height: height + headerHeight,
            width,
            top: -height,
          }}
        >
          <View flex>{_.map(screens, (o, i) => this.renderScreen(o, i))}</View>
          <View row vcenter style={{ ...styles.header, height: headerHeight }}>
            <View style={{ marginRight: 15 }}>
              <TouchableOpacity style={{ marginLeft: 15 }} onPress={this.open}>
                <MAIcon
                  name="menu"
                  size={30}
                  color={selectedScreen.hamburgerColor || "#FFF"}
                />
              </TouchableOpacity>
            </View>
            <View
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                width: "70%",
                height: "100%",
              }}
            >
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={{ color: "#ffffff", fontSize: 18, fontWeight: "bold" }}
              >
                {selectedScreen.name}
              </Text>
            </View>
          </View>
        </Animatable.View>
      </View>
    );
  }
}

const styles = {
  header: {
    shadowOpacity: 0.21,
    shadowOpacity: 1,
    shadowRadius: 2,
    shadowOffset: { height: 0, width: 0 },
    elevation: 3,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  headerTextParent: {
    flex: 1,
  },
  headerTextContainer: {
    flexDirection: "row",
    justifyContent: "center",
    backgroundColor: "red",
  },
};

FallingDrawer.propTypes = {
  screens: PropTypes.array,
  headerHeight: PropTypes.number,
  shakeDuration: PropTypes.number,
  optionCollapseSpeed: PropTypes.number,
  optionCollapseDelay: PropTypes.number,
  diversifyAnimations: PropTypes.bool,
  setSelectedScreen: PropTypes.func,
  setIsNavDrawerOpen: PropTypes.func,
  activeScreenDetails: PropTypes.object,
};

FallingDrawer.defaultProps = {
  headerHeight: HEADER_HEIGHT,
  shakeDuration: 800,
  optionCollapseSpeed: 150,
  optionCollapseDelay: 200,
  diversifyAnimations: true,
  setSelectedScreen: () => {},
  setIsNavDrawerOpen: () => {},
  activeScreenDetails: {},
};
