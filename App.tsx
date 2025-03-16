import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
} from "react-native";
import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Define the type for the data
type Item = {
  id: number;
  title: string;
};

const App: React.FC = () => {
  const [data, setData] = useState<Item[]>([]);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 5;

  // Check network connection status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected);
    });
    NetInfo.fetch().then((state) => setIsConnected(state.isConnected));
    return () => unsubscribe();
  }, []);

  const simulateSlowNetwork = async (): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, 3000));
  };

  const fetchAndCache = async (): Promise<void> => {
    if (!isConnected) {
      setIsLoading(true);
      setProgress(0);
      try {
        const cached = await AsyncStorage.getItem("cachedPosts");
        for (let i = 0; i <= 100; i += 10) {
          await new Promise((resolve) => setTimeout(resolve, 50));
          setProgress(i / 100);
        }
        setData(cached ? JSON.parse(cached) : []);
      } catch (error) {
        console.error("Error fetching cached data:", error);
        setData([]);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    setIsLoading(true);
    setProgress(0);

    try {
      await simulateSlowNetwork();

      const response = await fetch(
        "https://jsonplaceholder.typicode.com/posts"
      );
      const result: Item[] = await response.json();

      for (let i = 0; i <= 100; i += 10) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        setProgress(i / 100);
      }

      await AsyncStorage.setItem("cachedPosts", JSON.stringify(result));
      setData(result);
    } catch (error) {
      console.error("Error:", error);

      try {
        const cached = await AsyncStorage.getItem("cachedPosts");
        setData(cached ? JSON.parse(cached) : []);
      } catch (cacheError) {
        console.error("Error fetching cached data:", cacheError);
        setData([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const clearData = () => {
    setData([]);
  };

  const paginatedData = data.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <View style={styles.container}>
      <Text style={styles.statusText}>
        Network Status:{" "}
        {isConnected === null
          ? "Checking..."
          : isConnected
          ? "Online"
          : "Offline"}
      </Text>

      {isLoading ? (
        <>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text>
            Fetching {!isConnected ? "cached data" : "data"} Progress:{" "}
            {(progress * 100).toFixed(0)}%
          </Text>
        </>
      ) : data.length === 0 ? (
        <View style={styles.centeredContainer}>
          <Text style={styles.infoText}>
            No data available. Click the button below to fetch data.
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: "blue",
              paddingVertical: 10,
              paddingHorizontal: 15,
              borderRadius: 8,
            }}
            onPress={fetchAndCache}
          >
            <Text style={{ color: "white", fontSize: 16, fontWeight: "bold" }}>
              Fetch Data
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={paginatedData}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.item}>
                <Text style={styles.itemText}>{item.title}</Text>
              </View>
            )}
          />
          <View style={styles.pagination}>
            <TouchableOpacity
              style={{
                backgroundColor: currentPage === 1 ? "gray" : "blue",
                paddingVertical: 10,
                paddingHorizontal: 15,
                borderRadius: 8,
                opacity: currentPage === 1 ? 0.5 : 1, // Reduce opacity when disabled
              }}
              onPress={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <Text
                style={{ color: "white", fontSize: 16, fontWeight: "bold" }}
              >
                Previous
              </Text>
            </TouchableOpacity>
            <Text style={styles.pageText}>Page {currentPage}</Text>
            <TouchableOpacity
              style={{
                backgroundColor:
                  currentPage === Math.ceil(data.length / itemsPerPage)
                    ? "gray"
                    : "blue",
                paddingVertical: 10,
                paddingHorizontal: 15,
                borderRadius: 8,
                opacity:
                  currentPage === Math.ceil(data.length / itemsPerPage)
                    ? 0.5
                    : 1,
              }}
              onPress={() =>
                setCurrentPage((prev) =>
                  Math.min(prev + 1, Math.ceil(data.length / itemsPerPage))
                )
              }
              disabled={currentPage === Math.ceil(data.length / itemsPerPage)}
            >
              <Text
                style={{ color: "white", fontSize: 16, fontWeight: "bold" }}
              >
                Next
              </Text>
            </TouchableOpacity>
          </View>
          <View style={{ display: "flex", flexDirection: "row", gap: 10 }}>
            <TouchableOpacity
              style={{
                backgroundColor: "blue",
                paddingVertical: 10,
                paddingHorizontal: 15,
                borderRadius: 8,
              }}
              onPress={fetchAndCache}
            >
              <Text
                style={{ color: "white", fontSize: 16, fontWeight: "bold" }}
              >
                Fetch Data
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                backgroundColor: "red",
                paddingVertical: 10,
                paddingHorizontal: 15,
                borderRadius: 8,
              }}
              onPress={clearData}
            >
              <Text
                style={{ color: "white", fontSize: 16, fontWeight: "bold" }}
              >
                Clear Data
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#F5F5F5",
    paddingTop: 50,
  },
  centeredContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  statusText: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  infoText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  item: {
    backgroundColor: "#fff",
    padding: 15,
    marginVertical: 8,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: "95%",
    alignSelf: "center",
  },
  itemText: {
    fontSize: 16,
    color: "#444",
    fontWeight: "500",
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    width: "80%",
    marginBottom: 20,
  },
  pageText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
});

export default App;
