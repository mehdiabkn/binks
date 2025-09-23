import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';

export default function AboutSection({ onAction }) {
  const { t } = useTranslation();

  const aboutItems = [
    {
      key: 'privacy_policy',
      title: t('settings.about.privacyPolicy'),
    },
    {
      key: 'terms',
      title: t('settings.about.terms'),
    },
  ];

  return (
    <View style={styles.aboutCard}>
      <Text style={styles.cardTitle}>{t('settings.about.title')}</Text>
      
      {aboutItems.map((item, index) => (
        <TouchableOpacity
          key={item.key}
          style={[
            styles.aboutButton,
            index === aboutItems.length - 1 && styles.lastAboutButton
          ]}
          onPress={() => onAction(item.key)}
        >
          <Text style={styles.aboutButtonText}>{item.title}</Text>
          <Text style={styles.actionChevron}>›</Text>
        </TouchableOpacity>
      ))}
      
      <View style={styles.versionInfo}>
        <Text style={styles.versionText}>{t('settings.about.version')}</Text>
        <Text style={styles.versionSubtext}>{t('settings.about.madeWith')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  aboutCard: {
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
  aboutButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  lastAboutButton: {
    borderBottomWidth: 0,
  },
  aboutButtonText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#FFFFFF',
  },
  actionChevron: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.4)',
    fontWeight: 'bold',
  },
  versionInfo: {
    alignItems: 'center',
    paddingTop: 20,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  versionText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  versionSubtext: {
    fontFamily: 'Poppins-Regular',
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
});