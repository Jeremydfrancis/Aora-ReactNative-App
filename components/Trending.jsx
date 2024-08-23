import { useState, useRef, useEffect } from "react";
import { ResizeMode, Video } from "expo-av";
import * as Animatable from "react-native-animatable";
import {
  FlatList,
  Image,
  ImageBackground,
  TouchableOpacity,
  View,
  Dimensions,
} from "react-native";
import { WebView } from "react-native-webview";

import { icons } from "../constants";

const zoomIn = {
  0: {
    scale: 0.9,
  },
  1: {
    scale: 1,
  },
};

const zoomOut = {
  0: {
    scale: 1,
  },
  1: {
    scale: 0.9,
  },
};

const isEmbeddedVideo = (url) => {
  return url.includes("youtube.com") || url.includes("vimeo.com");
};

const TrendingItem = ({ activeItem, item, onVideoPress }) => {
  const [play, setPlay] = useState(false);
  const videoRef = useRef(null);

  if (!item || !item.video) {
    return null; // Early return if item or video is undefined
  }

  const isEmbedded = isEmbeddedVideo(item.video);

  useEffect(() => {
    if (activeItem !== item.$id && videoRef.current) {
      videoRef.current.stopAsync(); // Stop the video if it's no longer the active item
      setPlay(false);
    }
  }, [activeItem, item.$id]);

  useEffect(() => {
    return () => {
      if (videoRef.current) {
        videoRef.current.unloadAsync(); // Unload video when the component unmounts
      }
    };
  }, []);

  const handlePress = () => {
    onVideoPress(item.$id); // Notify parent component which video is being played
    setPlay(true);
  };

  const itemStyle = {
    width: Dimensions.get("window").width * 0.55,
    height: Dimensions.get("window").height * 0.45,
    borderRadius: 33,
    overflow: "hidden",
    marginTop: 15,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  };

  return (
    <Animatable.View
      style={{ marginRight: 20 }}
      animation={activeItem === item.$id ? zoomIn : zoomOut}
      duration={500}
    >
      {play ? (
        isEmbedded ? (
          <View style={itemStyle}>
            <WebView
              source={{ uri: item.video }}
              style={{ flex: 1 }}
              allowsInlineMediaPlayback={true}
              javaScriptEnabled={true}
              allowsFullscreenVideo={true}
              scalesPageToFit={true}
              startInLoadingState={true}
            />
          </View>
        ) : (
          <View style={itemStyle}>
            <Video
              ref={videoRef}
              source={{ uri: item.video }}
              style={{ flex: 1 }}
              useNativeControls
              resizeMode={ResizeMode.COVER}
              shouldPlay
              onPlaybackStatusUpdate={(status) => {
                if (status.didJustFinish) {
                  setPlay(false);
                }
              }}
              onError={(error) => {
                console.error("Video error:", error);
                setPlay(false);
              }}
            />
          </View>
        )
      ) : (
        <TouchableOpacity
          style={itemStyle}
          activeOpacity={0.7}
          onPress={handlePress}
        >
          <ImageBackground
            source={{ uri: item.thumbnail }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          >
            <View
              style={{
                justifyContent: "center",
                alignItems: "center",
                flex: 1,
              }}
            >
              <Image
                source={icons.play}
                style={{ width: 48, height: 48 }}
                resizeMode="contain"
              />
            </View>
          </ImageBackground>
        </TouchableOpacity>
      )}
    </Animatable.View>
  );
};

const Trending = ({ posts }) => {
  const [activeItem, setActiveItem] = useState(null);

  const handleVideoPress = (itemId) => {
    setActiveItem(itemId);
  };

  const viewableItemsChanged = ({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveItem(viewableItems[0].key);
    }
  };

  return (
    <FlatList
      data={posts}
      horizontal
      keyExtractor={(item) => item.$id}
      renderItem={({ item }) => (
        <TrendingItem
          activeItem={activeItem}
          item={item}
          onVideoPress={handleVideoPress}
        />
      )}
      onViewableItemsChanged={viewableItemsChanged}
      viewabilityConfig={{
        itemVisiblePercentThreshold: 70,
      }}
      contentOffset={{ x: 170 }}
    />
  );
};

export default Trending;
