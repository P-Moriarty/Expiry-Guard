import { ThemedText } from '@/components/themed-text';
import { getRecipeSuggestion } from '@/hooks/useAI';
import { ExpiryItem, getItems } from '@/hooks/useStorage';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { Bell, Clock, Filter, Plus, Search, Sparkles } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, Animated, SafeAreaView, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';

const CATEGORY_COLORS: Record<string, string> = {
  'Food': '#4CAF50',
  'Medicine': '#F44336',
  'Document': '#2196F3',
  'Other': '#9E9E9E'
};

const ItemCard = ({ item }: { item: ExpiryItem }) => {
  const expiryDate = new Date(item.expiryDate);
  const now = new Date();
  const diffDays = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const urgencyColor = diffDays <= 3 ? '#FF5252' : diffDays <= 7 ? '#FFD740' : '#4CAF50';

  return (
    <TouchableOpacity style={styles.card}>
      <View style={[styles.urgencyBar, { backgroundColor: urgencyColor }]} />
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <ThemedText type="defaultSemiBold" style={styles.itemName}>{item.name}</ThemedText>
          <View style={[styles.categoryBadge, { backgroundColor: CATEGORY_COLORS[item.category] + '20' }]}>
            <ThemedText style={[styles.categoryText, { color: CATEGORY_COLORS[item.category] }]}>{item.category}</ThemedText>
          </View>
        </View>
        <View style={styles.cardFooter}>
          <View style={styles.dateInfo}>
            <Clock size={14} color="#888" />
            <ThemedText style={styles.expiryText}>
              Expires: {expiryDate.toLocaleDateString()}
            </ThemedText>
          </View>
          <ThemedText style={[styles.daysLeft, { color: urgencyColor }]}>
            {diffDays} days left
          </ThemedText>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function HomeScreen() {
  const [items, setItems] = React.useState<ExpiryItem[]>([]);
  const [suggestion, setSuggestion] = React.useState<string | null>(null);
  const [isLoadingRecipe, setIsLoadingRecipe] = React.useState(false);
  const router = useRouter();
  const scrollY = React.useRef(new Animated.Value(0)).current;

  useFocusEffect(
    React.useCallback(() => {
      loadItems();
    }, [])
  );

  const loadItems = async () => {
    const data = await getItems();
    setItems(data);
  };

  const handleGetRecipe = async () => {
    const expiringSoon = items.filter(item => {
      const diff = Math.ceil((new Date(item.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return diff <= 3 && item.category === 'Food';
    }).map(i => i.name);

    if (expiringSoon.length === 0) {
      alert("No food items expiring soon to suggest recipes for!");
      return;
    }

    setIsLoadingRecipe(true);
    const recipe = await getRecipeSuggestion(expiringSoon);
    setSuggestion(recipe);
    setIsLoadingRecipe(false);
  };

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0.8],
    extrapolate: 'clamp',
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Stack.Screen options={{ headerShown: false }} />

      <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
        <View>
          <ThemedText type="title" style={styles.title}>Expiry Guard</ThemedText>
          <ThemedText style={styles.subtitle}>Keep track of what matters</ThemedText>
        </View>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.push('/notifications')}
        >
          <Bell size={24} color="#FFF" />
        </TouchableOpacity>
      </Animated.View>

      <View style={styles.searchBar}>
        <Search size={18} color="#888" />
        <ThemedText style={styles.searchPlaceholder}>Search items...</ThemedText>
        <TouchableOpacity>
          <Filter size={18} color="#888" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {items.filter(i => {
          const diff = Math.ceil((new Date(i.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
          return diff <= 3 && i.category === 'Food';
        }).length > 0 && (
            <TouchableOpacity
              style={styles.aiCard}
              onPress={handleGetRecipe}
              disabled={isLoadingRecipe}
            >
              <View style={styles.aiCardHeader}>
                <View style={styles.aiIcon}>
                  <Sparkles size={16} color="#FFF" />
                </View>
                <ThemedText style={styles.aiTitle}>AI Chef Insight</ThemedText>
                {isLoadingRecipe && <ActivityIndicator size="small" color="#3D5AFE" style={{ marginLeft: 'auto' }} />}
              </View>
              {suggestion ? (
                <ThemedText style={styles.suggestionText}>{suggestion}</ThemedText>
              ) : (
                <ThemedText style={styles.suggestionPrompt}>
                  You have food items expiring soon. Tap to get a recipe idea!
                </ThemedText>
              )}
            </TouchableOpacity>
          )}

        <Animated.FlatList
          data={items}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <ItemCard item={item} />}
          contentContainerStyle={styles.listContent}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Clock size={48} color="#333" />
              <ThemedText style={styles.emptyText}>No items tracked yet.</ThemedText>
              <ThemedText style={styles.emptySubtext}>Tap the + button to add your first item.</ThemedText>
            </View>
          }
        />
      </View>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/add-item')}
      >
        <Plus size={32} color="#FFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
  },
  subtitle: {
    color: '#888',
    fontSize: 14,
  },
  iconButton: {
    padding: 10,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    marginHorizontal: 20,
    marginTop: 15,
    marginBottom: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 10,
  },
  content: {
    flex: 1,
  },
  aiCard: {
    backgroundColor: '#1A1A1A',
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#3D5AFE40',
  },
  aiCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  aiIcon: {
    backgroundColor: '#3D5AFE',
    padding: 4,
    borderRadius: 6,
  },
  aiTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  suggestionPrompt: {
    fontSize: 13,
    color: '#3D5AFE',
    fontWeight: '500',
  },
  suggestionText: {
    fontSize: 13,
    color: '#CCC',
    lineHeight: 18,
  },
  searchPlaceholder: {
    flex: 1,
    color: '#555',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#151515',
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#222',
  },
  urgencyBar: {
    width: 6,
    height: '100%',
  },
  cardContent: {
    flex: 1,
    padding: 15,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 18,
    color: '#FFF',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  expiryText: {
    color: '#888',
    fontSize: 12,
  },
  daysLeft: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyText: {
    marginTop: 20,
    color: '#888',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptySubtext: {
    color: '#555',
    fontSize: 14,
    marginTop: 5,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#3D5AFE',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#3D5AFE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
