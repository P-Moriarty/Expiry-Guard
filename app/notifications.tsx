import { ThemedText } from '@/components/themed-text';
import { ExpiryItem, getItems } from '@/hooks/useStorage';
import { Stack, useRouter } from 'expo-router';
import { AlertCircle, Bell, Calendar, CheckCircle2, ChevronLeft } from 'lucide-react-native';
import React from 'react';
import { FlatList, SafeAreaView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function NotificationsScreen() {
    const [alerts, setAlerts] = React.useState<ExpiryItem[]>([]);
    const router = useRouter();

    React.useEffect(() => {
        loadAlerts();
    }, []);

    const loadAlerts = async () => {
        const items = await getItems();
        const now = new Date();

        // Sort items by expiry date, prioritizing those already expired or expiring soon
        const upcomingAlerts = items.filter(item => {
            const diff = Math.ceil((new Date(item.expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            return diff <= 14; // Show anything within 2 weeks
        }).sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

        setAlerts(upcomingAlerts);
    };

    const renderAlert = ({ item }: { item: ExpiryItem }) => {
        const expiryDate = new Date(item.expiryDate);
        const now = new Date();
        const diffDays = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        const isExpired = diffDays < 0;
        const isUrgent = diffDays <= 3;

        return (
            <View style={styles.alertCard}>
                <View style={[
                    styles.alertPulse,
                    { backgroundColor: isExpired ? '#FF5252' : isUrgent ? '#FFD740' : '#4CAF50' }
                ]} />
                <View style={styles.alertContent}>
                    <View style={styles.alertHeader}>
                        <ThemedText type="defaultSemiBold" style={styles.alertTitle}>
                            {item.name} {isExpired ? '(Expired)' : isUrgent ? '(Expiring Soon)' : ''}
                        </ThemedText>
                        {isExpired ? (
                            <AlertCircle size={18} color="#FF5252" />
                        ) : isUrgent ? (
                            <AlertCircle size={18} color="#FFD740" />
                        ) : (
                            <CheckCircle2 size={18} color="#4CAF50" />
                        )}
                    </View>
                    <ThemedText style={styles.alertDescription}>
                        {isExpired
                            ? `This item expired on ${expiryDate.toLocaleDateString()}.`
                            : `Expiration alert set for ${expiryDate.toLocaleDateString()}.`
                        }
                    </ThemedText>
                    <View style={styles.alertFooter}>
                        <View style={styles.dateBadge}>
                            <Calendar size={12} color="#888" />
                            <ThemedText style={styles.dateText}>{expiryDate.toLocaleDateString()}</ThemedText>
                        </View>
                        <ThemedText style={[
                            styles.urgencyText,
                            { color: isExpired ? '#FF5252' : isUrgent ? '#FFD740' : '#4CAF50' }
                        ]}>
                            {isExpired ? 'Action Required' : `${diffDays} days left`}
                        </ThemedText>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{
                headerShown: true,
                headerTitle: 'Alert Center',
                headerStyle: { backgroundColor: '#0A0A0A' },
                headerTintColor: '#FFF',
                headerLeft: () => (
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <ChevronLeft size={24} color="#FFF" />
                    </TouchableOpacity>
                ),
            }} />

            <FlatList
                data={alerts}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderAlert}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Bell size={48} color="#222" />
                        <ThemedText style={styles.emptyText}>All clear!</ThemedText>
                        <ThemedText style={styles.emptySubtext}>No urgent expiration alerts at the moment.</ThemedText>
                    </View>
                }
                ListHeaderComponent={
                    <View style={styles.headerInfo}>
                        <ThemedText style={styles.headerTitle}>Recent Activity</ThemedText>
                        <ThemedText style={styles.headerSubtitle}>
                            You have {alerts.length} active alerts to review.
                        </ThemedText>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0A0A0A',
    },
    backButton: {
        marginLeft: 10,
        backgroundColor: '#1A1A1A',
        borderRadius: 10,
        padding: 6,
    },
    listContent: {
        padding: 20,
        paddingBottom: 40,
    },
    headerInfo: {
        marginBottom: 25,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 5,
    },
    headerSubtitle: {
        color: '#888',
        fontSize: 14,
    },
    alertCard: {
        backgroundColor: '#151515',
        borderRadius: 20,
        marginBottom: 15,
        flexDirection: 'row',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#222',
    },
    alertPulse: {
        width: 6,
        height: '100%',
    },
    alertContent: {
        flex: 1,
        padding: 15,
    },
    alertHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    alertTitle: {
        fontSize: 16,
        color: '#FFF',
    },
    alertDescription: {
        fontSize: 13,
        color: '#888',
        lineHeight: 18,
        marginBottom: 12,
    },
    alertFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#222',
        paddingTop: 10,
    },
    dateBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#0A0A0A',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    dateText: {
        fontSize: 11,
        color: '#888',
    },
    urgencyText: {
        fontSize: 12,
        fontWeight: 'bold',
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
        textAlign: 'center',
    },
});
