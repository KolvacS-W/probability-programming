import React, { useEffect, useRef } from 'react';
import CodeEditor from '@uiw/react-textarea-code-editor';

interface ClassEditorProps {
  classcode: {
    js: string;
  };
  setClassCode: React.Dispatch<React.SetStateAction<{ js: string }>>;
}

const ClassEditor: React.FC<ClassEditorProps> = ({ classcode, setClassCode }) => {
  const editorRef = useRef<HTMLTextAreaElement>(null);

  return (
    <div className="class-editor"
    style={{ 
      height: '600px', 
      width: '400px', 
      overflow: 'auto',
     }}>
      <CodeEditor
        value={classcode.js}
        language="js"
        padding={15}
        style={{
          fontSize: 15,
          backgroundColor: '#f5f5f5',
          fontFamily:
            'ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
        }}
        ref={editorRef}
        onChange={(evn) => setClassCode({ js: evn.target.value })}
      />
    </div>
  );
};

export default ClassEditor;
