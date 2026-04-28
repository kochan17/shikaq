const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

const blankPng = path.resolve(__dirname, 'assets/blank.png');
const expoRouterAssetPattern = /^expo-router\/assets\/.*\.png$/;

const upstreamResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (expoRouterAssetPattern.test(moduleName)) {
    return { type: 'sourceFile', filePath: blankPng };
  }
  if (upstreamResolveRequest) {
    return upstreamResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './global.css' });
