import { useEffect, useState, useMemo } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  FlatList,
  Image,
  RefreshControl,
  Text,
  View,
  ActivityIndicator,
} from "react-native";

import { images } from "../../constants";
import useAppwrite from "../../lib/useAppwrite";
import {
  getAllPosts,
  getCurrentUser,
  getLatestPosts,
} from "../../lib/appwrite";
import VideoCard from "../../components/VideoCard";
import SearchInput from "../../components/SearchInput";
import Trending from "../../components/Trending";
import EmptyState from "../../components/EmptyState";

const Home = () => {
  const { data: posts, refetch, error: postsError } = useAppwrite(getAllPosts);
  const { data: latestPosts, error: latestPostsError } =
    useAppwrite(getLatestPosts);
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch the current user when the component mounts
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await getCurrentUser();

        if (currentUser) {
          setUser(currentUser);
        } else {
          console.log("No user found.");
        }
      } catch (error) {
        console.error("Failed to fetch user:", error.message);
      } finally {
        setLoadingUser(false);
      }
    };
    fetchUser();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const renderListHeader = useMemo(
    () => (
      <View className="flex my-6 px-4 space-y-6">
        <View className="flex justify-between items-start flex-row mb-6">
          <View>
            <Text className="font-pmedium text-sm text-gray-100">
              Welcome Back
            </Text>
            <Text className="text-2xl font-psemibold text-white">
              {loadingUser ? "Loading..." : user ? user.username : "Guest"}
            </Text>
          </View>
          <View className="mt-1.5">
            <Image
              source={images.logoSmall}
              className="w-9 h-10"
              resizeMode="contain"
            />
          </View>
        </View>
        <SearchInput />
        <View className="w-full flex-1 pt-5 pb-8">
          <Text className="text-lg font-pregular text-gray-100 mb-3">
            Latest Videos
          </Text>
          {latestPostsError ? (
            <Text>Error loading latest posts.</Text>
          ) : (
            <Trending className="z-50" posts={latestPosts ?? []} />
          )}
        </View>
      </View>
    ),
    [user, latestPosts, loadingUser, latestPostsError]
  );

  if (loadingUser || (postsError && !refreshing)) {
    return (
      <SafeAreaView className="bg-primary flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#ffffff" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="bg-primary h-full">
      <FlatList
        data={posts}
        keyExtractor={(item) => item.$id}
        renderItem={({ item }) => (
          <VideoCard
            title={item.title}
            thumbnail={item.thumbnail}
            video={item.video}
            creator={item.creator?.username || "Unknown"}
            avatar={item.creator?.avatar || images.defaultAvatar} // Use a default image if avatar is missing
          />
        )}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={() => (
          <EmptyState
            title="No Videos Found"
            subtitle="Be the first to upload a video!"
          />
        )}
        refreshControl={
          <RefreshControl
            tintColor="#fff"
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
      />
    </SafeAreaView>
  );
};

export default Home;
