module.exports = {
  entry: './built/src/rts.js',
  output: { 
    filename: 'built/stopify.bundle.js',
    library: 'stopify',
    libraryTarget: 'var'
  },
  node: {
    // Commander has these as dependencies
    'fs': 'empty',
    'child_process': 'empty',
  }
};
