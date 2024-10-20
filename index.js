import React, { Component } from "react";
import { Dimensions, TouchableOpacity, Text, Platform } from "react-native";
import View from "react-native-view";
import PropTypes from "prop-types";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
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
    selectedScreen: null,
    activeScreenDetails: null,
    isNotificationOpen: false,
  };

  UNSAFE_componentWillMount() {
    const { screens } = this.props;
    if (!screens || screens.length == 0) {
      return;
    }
    this.optionViews = {};
    this.setState(() => ({
      screens,
      selectedScreen: screens[0],
      isNotificationOpen: false,
    }));
  }

  componentDidUpdate(prevProps, prevState) {
    if (!_.isEqual(this.state.selectedScreen, prevState.selectedScreen)) {
      const latestSelectedScreen = this.state.selectedScreen;
      this.props.setSelectedScreen(latestSelectedScreen);
      this.setState(() => ({
        ...this.state,
        isNotificationOpen: false,
      }));
      this.props.setIsNotificationOpen(false);
    }

    if (
      _.has(this.props.activeScreenDetails, "key") &&
      !_.isEqual(this.props.activeScreenDetails, prevProps.activeScreenDetails)
    ) {
      const { key: activeScreenKey, name: activeScreenName } =
        this.props.activeScreenDetails;

      let selectedScreen = this.state.selectedScreen;
      if (selectedScreen.key === activeScreenKey) {
        selectedScreen.name = activeScreenName;
      }

      this.setState(() => ({
        selectedScreen,
        isNotificationOpen: false,
      }));
      this.props.setIsNotificationOpen(false);
    }

    if (this.props.isNotificationOpen !== prevProps.isNotificationOpen) {
      this.setState(() => ({
        ...this.state,
        isNotificationOpen: this.props.isNotificationOpen,
      }));
    }

    if (this.props.closeNavDrawer) {
      this.close();
    }
  }

  openNavDrawer = async () => {
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
    this.setState(() => ({
      ...this.state,
      isNotificationOpen: false,
    }));
    this.props.setIsNotificationOpen(false);
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

  setIsNotificationOpen = () => {
    const isNotificationOpen = !this.state.isNotificationOpen;
    this.setState(() => ({ ...this.state, isNotificationOpen }));
    this.props.setIsNotificationOpen(isNotificationOpen);
  };

  navigateToPage = (page) => {
    const { screens = [] } = this.state;
    const pageToNavigateTo = screens.find((sc) => sc.key === page);
    this.setState(() => ({ selectedScreen: pageToNavigateTo }));
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
                    fontWeight: "bold",
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
    const { headerHeight, hasUnreadNotifications = false } = this.props;
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
          <View flex>
            {screens
              .sort((a, b) => {
                return b.index - a.index;
              })
              .map((o, i) => this.renderScreen(o, i))}
          </View>
          <View row vcenter style={{ ...styles.header, height: headerHeight }}>
            <View style={{ marginRight: 12 }}>
              <TouchableOpacity onPress={this.openNavDrawer}>
                <MaterialIcons
                  name="menu"
                  size={30}
                  color={selectedScreen.hamburgerColor || "#ffffff"}
                />
              </TouchableOpacity>
            </View>
            <View style={styles.topMiddleContainer}>
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={{ color: "#ffffff", fontSize: 18, fontWeight: "bold" }}
              >
                {selectedScreen.name}
              </Text>
            </View>
            <View style={styles.topRightContainer}>
              <View>
                <TouchableOpacity
                  onPress={() => this.navigateToPage("ongoing_admissions")}
                >
                  <MaterialCommunityIcons
                    name="school-outline"
                    size={24}
                    color={"#ffffff"}
                  />
                </TouchableOpacity>
              </View>

              <View style={{ marginLeft: 12 }}>
                <TouchableOpacity onPress={this.setIsNotificationOpen}>
                  <MaterialIcons
                    name="notifications-none"
                    size={24}
                    color={"#ffffff"}
                  />
                </TouchableOpacity>
                {hasUnreadNotifications && (
                  <FontAwesome
                    name="circle"
                    size={12}
                    color={"#32CD32"}
                    style={{ position: "absolute", right: 2, top: 0 }}
                  />
                )}
              </View>
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
    paddingHorizontal: 12,
  },
  headerTextParent: {
    flex: 1,
  },
  headerTextContainer: {
    flexDirection: "row",
    justifyContent: "center",
    backgroundColor: "red",
  },
  topMiddleContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
    width: "70%",
  },
  topRightContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 10,
    width: "30%",
    height: "100%",
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
  setIsNotificationOpen: PropTypes.func,
  isNotificationOpen: PropTypes.bool,
  hasUnreadNotifications: PropTypes.bool,
  closeNavDrawer: PropTypes.bool,
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
  setIsNotificationOpen: () => {},
  isNotificationOpen: false,
  hasUnreadNotifications: false,
  closeNavDrawer: false,
};
