import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { createEditor, Transforms, Editor, Descendant, Element } from 'slate';
import { Slate, Editable, withReact } from 'slate-react';
import { WebsocketProvider } from 'y-websocket';
// Import the core binding
import {
  withYjs,
  slateNodesToInsertDelta,
  YjsEditor,
  yTextToSlateElement,
  withYHistory,
} from '@slate-yjs/core';

// Import yjs
import * as Y from 'yjs';

// Define a React component renderer for our code blocks.
const CodeElement = (props: any) => (
  <pre {...props.attributes}>
    <code>{props.children}</code>
  </pre>
);
// @ts-ignore
window.editorC = Editor;
// @ts-ignore
window.yTextToSlateElement = yTextToSlateElement;

const DefaultElement = (props: any) => (
  <p {...props.attributes}>{props.children}</p>
);

const initialValue: Descendant[] = [
  {
    type: 'paragraph',
    children: [{ text: 'Try it out for yourself!' }],
  },
];

const yDoc = new Y.Doc();

const wsProvider = new WebsocketProvider(
  'ws://localhost:1234',
  'my-roomname',
  yDoc
);

wsProvider.on('status', (event) => {
  console.log(event.status); // logs "connected" or "disconnected"
});

const SimplePage = () => {
  const [value, setValue] = useState(initialValue || []);
  console.log('🚀 ~ MainEditor ~ value:', value);
  const sharedType = useMemo(() => {
    // Load the initial value into the yjs document
    const actualSharedType = yDoc.get('content', Y.XmlText);
    actualSharedType.insert(0, 'hello');

    return actualSharedType as Y.XmlText;
  }, []);

  const editor = useMemo(
    () => withYHistory(withYjs(withReact(createEditor()), sharedType)),
    []
  );

  console.log('🚀 ~ MainEditor ~ editor:', editor);

  const renderElement = useCallback((props: any) => {
    switch (props.element.type) {
      case 'code':
        return <CodeElement {...props} />;
      case 'block-quote':
        return <blockquote {...props.attributes}>{props.children}</blockquote>;
      default:
        return <DefaultElement {...props} />;
    }
  }, []);

  useEffect(() => {
    YjsEditor.connect(editor);
    return () => YjsEditor.disconnect(editor);
  }, [editor]);
  // Define a React component to render leaves with bold text.
  const Leaf = ({ attributes, children, leaf }) => {
    if (leaf.bold) {
      children = <strong>{children}</strong>;
    }

    if (leaf.code) {
      children = <code>{children}</code>;
    }

    if (leaf.italic) {
      children = <em>{children}</em>;
    }

    if (leaf.underline) {
      children = <u>{children}</u>;
    }

    return <span {...attributes}>{children}</span>;
  };

  const renderLeaf = useCallback((props: any) => <Leaf {...props} />, []);

  return (
    <div className="flex justify-center my-32 mx-10">
      {/* <button onClick={(e) => {
        e.preventDefault();
        Transforms.select(editor, {
          anchor: { path: [0, 0], offset: 0 },
          focus: { path: [0, 0], offset: 5 },
        });
        let text = yDoc.getText('我是a');
        text.insert(0, 'hhha');
      }}>
        点击更新yDoc1
      </button> */}
      <Slate
        editor={editor}
        value={value}
        onChange={(_value) => {
          console.log('changes', _value);
          setValue({ ..._value });
        }}
      >
        <Editable
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          onKeyDown={(event: any) => {
            if (event.key === '&') {
              event.preventDefault();
              editor.insertText('and');
            }
          }}
        />
      </Slate>
    </div>
  );
};

export default SimplePage;
