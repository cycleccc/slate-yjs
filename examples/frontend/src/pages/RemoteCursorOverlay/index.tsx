// import { HocuspocusProvider } from '@hocuspocus/provider';
import { WebsocketProvider } from 'y-websocket';
import { withCursors, withYHistory, withYjs, YjsEditor } from '@slate-yjs/core';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { Descendant } from 'slate';
import { createEditor } from 'slate';
import { Slate, withReact } from 'slate-react';
import * as Y from 'yjs';
import { ConnectionToggle } from '../../components/ConnectionToggle/ConnectionToggle';
import { CustomEditable } from '../../components/CustomEditable/CustomEditable';
import { FormatToolbar } from '../../components/FormatToolbar/FormatToolbar';
import { HOCUSPOCUS_ENDPOINT_URL } from '../../config';
import { withMarkdown } from '../../plugins/withMarkdown';
import { withNormalize } from '../../plugins/withNormalize';
import { randomCursorData } from '../../utils';
import { RemoteCursorOverlay } from './Overlay';

const yDoc = new Y.Doc();

const wsProvider = new WebsocketProvider(
  'ws://localhost:1234',
  'my-roomname',
  yDoc
);

wsProvider.on('status', (event) => {
  console.log(event.status); // logs "connected" or "disconnected"
});
export function RemoteCursorsOverlayPage() {
  const [value, setValue] = useState<Descendant[]>([]);

  const editor = useMemo(() => {
    const sharedType = yDoc.get('content', Y.XmlText) as Y.XmlText;

    return withMarkdown(
      withNormalize(
        withReact(
          withYHistory(
            withCursors(
              withYjs(createEditor(), sharedType, { autoConnect: false }),
              wsProvider.awareness,
              {
                data: randomCursorData(),
              }
            )
          )
        )
      )
    );
  }, [wsProvider.awareness]);

  // Connect editor and provider in useEffect to comply with concurrent mode
  // requirements.
  useEffect(() => {
    wsProvider.connect();
    return () => wsProvider.disconnect();
  }, [wsProvider]);
  useEffect(() => {
    YjsEditor.connect(editor);
    return () => YjsEditor.disconnect(editor);
  }, [editor]);

  return (
    <React.Fragment>
      <Slate value={value} onChange={setValue} editor={editor}>
        <RemoteCursorOverlay className="flex justify-center my-32 mx-10">
          {/* <FormatToolbar /> */}
          <CustomEditable className="max-w-4xl w-full flex-col break-words" />
        </RemoteCursorOverlay>
      </Slate>
    </React.Fragment>
  );
}
