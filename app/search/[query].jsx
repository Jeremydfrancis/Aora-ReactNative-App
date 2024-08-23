import { useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { View, Text, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import useAppwrite from "../../lib/useAppwrite";
import { searchPosts } from "../../lib/appwrite";
import VideoCard from "../../components/VideoCard";
import SearchInput from "../../components/SearchInput";
import EmptyState from "../../components/EmptyState";
import CustomButton from "../../components/CustomButton";
import Loader from "../../components/Loader";

const Search = () => {
  const { query } = useLocalSearchParams();
  const {
    data: posts,
    refetch,
    loading,
  } = useAppwrite(() => searchPosts(query));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(loading);
  }, [loading]);

  useEffect(() => {
    refetch();
  }, [query]);

  return (
    <SafeAreaView className="bg-primary h-full">
      {isLoading ? (
        <Loader isLoading={isLoading} />
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
          ListHeaderComponent={() => (
            <>
              <View className="flex my-6 px-4">
                <Text className="font-pmedium text-gray-100 text-sm">
                  Search Results
                </Text>
                <Text className="text-2xl font-psemibold text-white mt-1">
                  {query}
                </Text>

                <View className="mt-6 mb-8">
                  <SearchInput initialQuery={query} refetch={refetch} />
                </View>
              </View>
            </>
          )}
          ListEmptyComponent={() => (
            <EmptyState
              title="No Videos Found"
              subtitle="No videos found for this search query"
            />
          )}
        />
      )}
      {!isLoading && posts && posts.length > 0 && (
        <CustomButton
          title="Back to Explore"
          handlePress={() => router.replace("/home")}
          containerStyles="w-full my-5"
        />
      )}
    </SafeAreaView>
  );
};

export default Search;
