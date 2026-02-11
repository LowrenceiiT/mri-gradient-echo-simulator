Project Structure 

mri-gradient-echo-simulator/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .gitignore
├── README.md
├── node_modules/
├── dist/ (created after npm run build)
└── src/
    ├── App.tsx
    ├── index.tsx
    ├── types.ts
    ├── constants.ts
    ├── components/
    │   ├── ControlPanel.tsx
    │   ├── VectorView.tsx
    │   ├── KSpaceView.tsx
    │   ├── Charts.tsx
    │   └── EquationViewer.tsx
    └── utils/
        ├── physics.ts
        ├── sound.ts
        └── teaching.ts
