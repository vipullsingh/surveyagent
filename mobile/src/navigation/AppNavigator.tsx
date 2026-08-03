import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';

import { CaseListScreen } from '../screens/CaseListScreen';
import { CaseDetailScreen } from '../screens/CaseDetailScreen';
import { CameraEvidenceScreen } from '../screens/CameraEvidenceScreen';
import { VoiceNotesScreen } from '../screens/VoiceNotesScreen';
import { ChecklistFormScreen } from '../screens/ChecklistFormScreen';
import { ReportPreviewScreen } from '../screens/ReportPreviewScreen';

const Stack = createStackNavigator();

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="CaseList"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="CaseList" component={CaseListScreen} />
        <Stack.Screen name="CaseDetail" component={CaseDetailScreen} />
        <Stack.Screen name="CameraEvidence" component={CameraEvidenceScreen} />
        <Stack.Screen name="VoiceNotes" component={VoiceNotesScreen} />
        <Stack.Screen name="ChecklistForm" component={ChecklistFormScreen} />
        <Stack.Screen name="ReportPreview" component={ReportPreviewScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
