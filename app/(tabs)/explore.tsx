import { ThemedText } from '@/components/themed-text';
import { getCloudStats, getItems, syncData } from '@/hooks/useStorage';
import { Stack, useFocusEffect } from 'expo-router';
import { AlertTriangle, BarChart3, Check, Cloud, Leaf, RefreshCcw, ShieldCheck, TrendingDown } from 'lucide-react-native';
import React from 'react';
import { Dimensions, SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

const StatCard = ({ title, value, icon: Icon, color }: any) => (
  <View style={styles.statCard}>
    <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
      <Icon size={20} color={color} />
    </View>
    <View>
      <ThemedText style={styles.statValue}>{value}</ThemedText>
      <ThemedText style={styles.statTitle}>{title}</ThemedText>
    </View>
  </View>
);

const TipCard = ({ title, description, icon: Icon }: any) => (
  <View style={styles.tipCard}>
    <View style={styles.tipIcon}>
      <Icon size={24} color="#3D5AFE" />
    </View>
    <View style={styles.tipContent}>
      <ThemedText type="defaultSemiBold" style={styles.tipTitle}>{title}</ThemedText>
      <ThemedText style={styles.tipDescription}>{description}</ThemedText>
    </View>
  </View>
);

export default function InsightsScreen() {
  const [stats, setStats] = React.useState({
    total: 0,
    expiringSoon: 0,
    expired: 0,
    saved: 0
  });
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [lastSynced, setLastSynced] = React.useState<Date | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      loadStats();
    }, [])
  );

  const handleSync = async () => {
    setIsSyncing(true);
    const success = await syncData();
    if (success) {
      setLastSynced(new Date());
      loadStats();
    }
    setIsSyncing(false);
  };

  const loadStats = async () => {
    // 1. Try to get stats from the API
    const cloudStats = await getCloudStats();
    if (cloudStats) {
      setStats(cloudStats);
      return;
    }

    // 2. Fallback to local calculation if API fails
    const items = await getItems();
    const now = new Date();

    let expiringSoon = 0;
    let expired = 0;

    items.forEach(item => {
      const diff = Math.ceil((new Date(item.expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (diff < 0) expired++;
      else if (diff <= 3) expiringSoon++;
    });

    setStats({
      total: items.length,
      expiringSoon,
      expired,
      saved: items.length - expired
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{
        headerTitle: 'Insights',
        headerStyle: { backgroundColor: '#0A0A0A' },
        headerTintColor: '#FFF',
        headerRight: () => (
          <TouchableOpacity
            onPress={handleSync}
            disabled={isSyncing}
            style={{ marginRight: 15 }}
          >
            {isSyncing ? (
              <RefreshCcw size={20} color="#3D5AFE" />
            ) : lastSynced ? (
              <Check size={20} color="#4CAF50" />
            ) : (
              <Cloud size={20} color="#FFF" />
            )}
          </TouchableOpacity>
        )
      }} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Overview</ThemedText>
          <View style={styles.statsGrid}>
            <StatCard
              title="Total Tracked"
              value={stats.total}
              icon={ShieldCheck}
              color="#3D5AFE"
            />
            <StatCard
              title="Expiring Soon"
              value={stats.expiringSoon}
              icon={AlertTriangle}
              color="#FFD740"
            />
            <StatCard
              title="Saved Items"
              value={stats.saved}
              icon={Leaf}
              color="#4CAF50"
            />
            <StatCard
              title="Waste Prevented"
              value={`${Math.round((stats.saved / (stats.total || 1)) * 100)}%`}
              icon={TrendingDown}
              color="#FF5252"
            />
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Preservation Tips</ThemedText>
          <TipCard
            title="Optimal Temperature"
            description="Keep your fridge at 4°C (40°F) or below to slow down bacterial growth."
            icon={TrendingDown}
          />
          <TipCard
            title="Ethylene Gas"
            description="Keep apples and bananas away from other produce to prevent premature ripening."
            icon={Leaf}
          />
          <TipCard
            title="First In, First Out"
            description="Always place newer items behind older ones to ensure you use the oldest stock first."
            icon={BarChart3}
          />
        </View>

        <View style={styles.premiumCard}>
          <ThemedText style={styles.premiumTitle}>Upgrade to Pro</ThemedText>
          <ThemedText style={styles.premiumText}>Get detailed reports and household sharing features.</ThemedText>
          <TouchableOpacity style={styles.premiumButton}>
            <ThemedText style={styles.premiumButtonText}>Learn More</ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    color: '#FFF',
    marginBottom: 15,
    fontSize: 20,
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  statCard: {
    backgroundColor: '#151515',
    width: (width - 55) / 2,
    padding: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#222',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statIconContainer: {
    padding: 10,
    borderRadius: 12,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  statTitle: {
    fontSize: 11,
    color: '#888',
  },
  tipCard: {
    backgroundColor: '#151515',
    padding: 15,
    borderRadius: 20,
    marginBottom: 12,
    flexDirection: 'row',
    gap: 15,
    borderWidth: 1,
    borderColor: '#222',
  },
  tipIcon: {
    backgroundColor: '#3D5AFE10',
    padding: 12,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    color: '#FFF',
    fontSize: 16,
    marginBottom: 4,
  },
  tipDescription: {
    color: '#888',
    fontSize: 13,
    lineHeight: 18,
  },
  premiumCard: {
    backgroundColor: '#1A1A1A',
    padding: 25,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#3D5AFE40',
    alignItems: 'center',
    marginTop: 10,
  },
  premiumTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  premiumText: {
    color: '#888',
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 14,
  },
  premiumButton: {
    backgroundColor: '#3D5AFE',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 15,
  },
  premiumButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
