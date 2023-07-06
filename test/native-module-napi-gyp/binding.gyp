{
  'targets': [
    {
      'target_name': 'native',
      'sources': [
        'src/native.cc',
      ],
      'defines': [
        'NAPI_VERSION=<(napi_build_version)',
      ],
      'xcode_settings': {
        'MACOSX_DEPLOYMENT_TARGET': '10.9'
      }
    }
  ]
}
