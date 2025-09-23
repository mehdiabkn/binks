import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';

export default function ActionsSection({ onAction }) {
  const { t } = useTranslation();

  const actionItems = [
    {
      key: 'export_data',
      icon: '📊',
      title: t('settings.actions.exportData.title'),
      description: t('settings.actions.exportData.description'),
    },
    {
      key: 'contact_support',
      icon: '💬',
      title: t('settings.actions.contactSupport.title'),
      description: t('settings.actions.contactSupport.description'),
    },
    {
      key: 'rate_app',
      icon: '⭐',
      title: t('settings.actions.rateApp.title'),
      description: t('settings.actions.rateApp.description'),
    },
  ];

  return (
    <View style={styles.actionsCard}>
      <Text style={styles.cardTitle}>{t('settings.actions.title')}</Text>
      
      {actionItems.map((item, index) => (
        <TouchableOpacity
          key={item.key}
          style={[
            styles.actionButton,
            index === actionItems.length - 1 && styles.lastActionButton
          ]}
          onPress={() => onAction(item.key)}
        >
          <Text style={styles.actionIcon}>{item.icon}</Text>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>{item.title}</Text>
            <Text style={styles.actionDescription}>{item.description}</Text>
          </View>
          <Text style={styles.actionChevron}>›</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  actionsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 20,
  },
  cardTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 15,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  lastActionButton: {
    borderBottomWidth: 0,
  },
  actionIcon: {
    fontSize: 20,
    marginRight: 15,
    width: 24,
    textAlign: 'center',
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  actionDescription: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  actionChevron: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.4)',
    fontWeight: 'bold',
  },
});