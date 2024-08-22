import { useEffect, useState } from "react";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Image,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";

import { icons } from "../../constants";
import useAppwrite from "../../lib/useAppwrite";
import { getUserPosts, signOut } from "../../lib/appwrite";
import { useGlobalContext } from "../../context/GlobalProvider";
import VideoCard from "../../components/VideoCard";
import InfoBox from "../../components/InfoBox";
import EmptyState from "../../components/EmptyState";

const Profile = () => {
  const { user, setUser, setIsLogged } = useGlobalContext();
  const {
    data: posts,
    loading,
    error,
  } = useAppwrite(() => getUserPosts(user.$id));
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(!loading); // Trigger the update only when loading is false
  }, [loading]);

  const logout = async () => {
    await signOut();
    setUser(null);
    setIsLogged(false);
    router.replace("/sign-in");
  };

  if (error) {
    return (
      <SafeAreaView className="bg-primary flex-1 justify-center items-center">
        <Text>Error loading profile data.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="bg-primary h-full">
      <View className="w-full flex justify-center items-center mt-6 mb-12 px-4">
        <TouchableOpacity
          onPress={logout}
          className="flex w-full items-end mb-10"
        >
          <Image
            source={icons.logout}
            resizeMode="contain"
            className="w-6 h-6"
          />
        </TouchableOpacity>

        <Image
          source={{ uri: user?.avatar }}
          className="w-16 h-16 rounded-lg"
          resizeMode="cover"
        />
        <InfoBox
          title={user?.username}
          containerStyles="mt-5"
          titleStyles="text-lg"
        />
        <View className="mt-5 flex flex-row">
          <InfoBox
            title={isLoaded ? posts.length.toString() : "Loading..."}
            subtitle="Posts"
            titleStyles="text-xl"
            containerStyles="mr-10"
          />
          <InfoBox title="1.2k" subtitle="Followers" titleStyles="text-xl" />
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#ffffff" />
      ) : posts.length === 0 ? (
        <EmptyState
          title="No Videos Found"
          subtitle="No videos found for this profile"
        />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.$id}
          renderItem={({ item }) => (
            <VideoCard
              title={item.title}
              thumbnail={item.thumbnail}
              video={item.video}
              creator={item.creator.username}
              avatar={item.creator.avatar}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
};

export default Profile;
