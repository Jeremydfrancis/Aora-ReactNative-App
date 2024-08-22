import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
} from "react-native";
import { Video } from "expo-av";
import { WebView } from "react-native-webview";
import { icons } from "../constants";

const VideoCard = ({ title, creator, avatar, thumbnail, video }) => {
  const [play, setPlay] = useState(false);
  const videoRef = useRef(null);
  const isEmbedded =
    video.includes("youtube.com") || video.includes("vimeo.com");

  useEffect(() => {
    return () => {
      if (videoRef.current) {
        videoRef.current.unloadAsync(); // Unload the video when the component unmounts
      }
    };
  }, []);
  useEffect(() => {
    if (!video) {
      Alert.alert("Data Issue", "Missing video URL for " + title);
    }
  }, [video, title]);

  const itemStyle = {
    height: Dimensions.get("window").width * 0.5625, // 16:9 aspect ratio
    width: "100%",
    marginTop: 14,
    borderRadius: 10,
    overflow: "hidden",
  };

  return (
    <View
      style={{
        flexDirection: "column",
        alignItems: "center",
        paddingHorizontal: 16,
        marginBottom: 56,
      }}
    >
      <View style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
          <View
            style={{
              width: 46,
              height: 46,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: "#ccc",
              justifyContent: "center",
              alignItems: "center",
              padding: 1,
            }}
          >
            <Image
              source={{ uri: avatar }}
              style={{ width: "100%", height: "100%", borderRadius: 10 }}
              resizeMode="cover"
            />
          </View>

          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text
              style={{ fontWeight: "600", fontSize: 14, color: "#fff" }}
              numberOfLines={1}
            >
              {title}
            </Text>
            <Text style={{ fontSize: 12, color: "#ccc" }} numberOfLines={1}>
              {creator}
            </Text>
          </View>
        </View>

        <View style={{ paddingTop: 8 }}>
          <Image
            source={icons.menu}
            style={{ width: 20, height: 20 }}
            resizeMode="contain"
          />
        </View>
      </View>

      {play ? (
        isEmbedded ? (
          <View style={itemStyle}>
            <WebView
              source={{ uri: video }}
              style={{ flex: 1 }}
              allowsInlineMediaPlayback={true}
              javaScriptEnabled={true}
              allowsFullscreenVideo={true}
            />
          </View>
        ) : (
          <View style={itemStyle}>
            <Video
              ref={videoRef}
              source={{ uri: video }}
              style={{ flex: 1, margin: 0, padding: 0 }}
              useNativeControls
              shouldPlay
              resizeMode="cover"
              onPlaybackStatusUpdate={(status) => {
                if (status.didJustFinish) {
                  setPlay(false);
                }
                if (!status.isLoaded) {
                  Alert.alert("Error", "Failed to load the video.");
                  setPlay(false);
                }
              }}
              onError={(error) => {
                Alert.alert("Error", "Failed to load the video.");
                setPlay(false);
              }}
            />
          </View>
        )
      ) : (
        <TouchableOpacity
          style={[
            itemStyle,
            { justifyContent: "center", alignItems: "center" },
          ]}
          activeOpacity={0.7}
          onPress={() => setPlay(true)}
        >
          <Image
            source={{ uri: thumbnail }}
            style={{ width: "100%", height: "100%", borderRadius: 10 }}
            resizeMode="cover"
          />

          <Image
            source={icons.play}
            style={{ width: 48, height: 48, position: "absolute" }}
            resizeMode="contain"
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default VideoCard;
