import { autorun, toJS } from 'mobx';
import { observer } from 'mobx-react-lite';
import React, { FunctionComponent, useEffect, useRef, useState } from 'react';
import { useMatch } from 'react-router-dom';
import styled from 'styled-components';

import EmojiIcon from '@fc/shared/assets/icons/EmojiIcon';
import GearIcon from '@fc/shared/assets/icons/GearIcon';
import SendArrowIcon from '@fc/shared/assets/icons/SendArrowIcon';
import { CustomLink } from '@fc/shared/components/CustomLink';
import { GiphyGrid } from '@fc/shared/components/GiphyGrid';
import Tooltip from '@fc/shared/components/Tooltip';
import { useSocket } from '@fc/shared/utils/SocketProvider';
import { ConnectionEnum } from '@fc/shared/utils/interfaces';

import { useStore } from '../../../store/RootStore';

export const ChatBar: FunctionComponent = observer(() => {
  const store = useStore();
  const socket = useSocket();

  const isSettings = useMatch('/settings');
  const emojiPickerRef = useRef<React.ElementRef<typeof Tooltip>>(null);
  const chatTextInput = useRef<HTMLInputElement>(null);
  const [messageText, setMessageText] = useState('');

  const [isFailed, setIsFailed] = useState(
    store.status === ConnectionEnum.ERROR
  );
  const [isConnected, setIsConnected] = useState(
    store.status === ConnectionEnum.CONNECTED
  );

  useEffect(
    () =>
      autorun(() => {
        setIsFailed(store.status === ConnectionEnum.ERROR);
        setIsConnected(store.status === ConnectionEnum.CONNECTED);
      }),
    []
  );

  const sendMessage = (e: any, msg?: string) => {
    e.preventDefault();

    const text = msg || messageText;

    if (socket && chatTextInput.current && text) {
      if (text.startsWith('/giphy')) {
        return;
      }

      store.addLocalMessage(
        {
          message: {
            text,
            external: true,
          },
        },
        socket
      );

      chatTextInput.current.value = '';
      setMessageText('');
    }
  };
  return (
    <>
      <GiphyGrid
        store={store}
        setTextMessage={(p) => {
          setMessageText(p);
          if (chatTextInput.current) {
            chatTextInput.current.value = p;
          }
        }}
        textMessage={messageText}
      />
      <ChatBarForm isSettings={Boolean(isSettings)} onSubmit={sendMessage}>
        <ChatInputWrapper>
          <SettingsAndUsers>
            <CustomLink to="/settings">
              <div
                className={`gear ${store.settings.isDarkTheme ? 'dark' : ''}`}
              >
                <GearIcon />
              </div>
            </CustomLink>
            {store.status === ConnectionEnum.CONNECTED && (
              <CustomLink to="/user-list">
                <Users>
                  <UserChips>
                    {store.online
                      .filter((_, i) => i < 2)
                      .map((user, i) => (
                        <Chip
                          key={i}
                          style={{
                            backgroundColor: user.color,
                            backgroundImage: !user?.avatar
                              ? `url(${user.photoUrl})`
                              : undefined,
                          }}
                        >
                          {user?.avatar || ''}
                        </Chip>
                      ))}
                    {store.online.length > 2 && (
                      <Chip>+{store.online.length - 2}</Chip>
                    )}
                  </UserChips>
                </Users>
              </CustomLink>
            )}
          </SettingsAndUsers>

          <ChatInput isConnected={isConnected}>
            <input
              ref={chatTextInput}
              type="input"
              onChange={({ target }: any) =>
                setMessageText(target.value.substr(0, 1000))
              }
              placeholder="Write something ..."
            />

            <Tooltip
              ref={emojiPickerRef}
              style={{
                paddingTop: 11,
                paddingBottom: 11,
                paddingLeft: 17,
                paddingRight: 17,
              }}
              handler={React.forwardRef(
                (p, ref: React.ForwardedRef<HTMLInputElement>) => (
                  <EmojiPickerStyled {...p} ref={ref}>
                    <EmojiIcon />
                  </EmojiPickerStyled>
                )
              )}
            >
              <EmojiList>
                {['😂', '😊', '👍', '🙈', '🔥', '🤔', '💩'].map((emoji) => (
                  <span
                    key={emoji}
                    data-emoji={emoji}
                    onClick={(e) => {
                      sendMessage(e, emoji);
                      emojiPickerRef.current.hide();
                    }}
                  />
                ))}
              </EmojiList>
            </Tooltip>

            <SendButton color={store.currentUser.color} onClick={sendMessage}>
              <SendArrowIcon />
            </SendButton>
          </ChatInput>
        </ChatInputWrapper>
      </ChatBarForm>
    </>
  );
});

const Users = styled.div`
  display: flex;
  align-items: center;
  margin-left: auto;
  margin-left: 5px;
`;

const Chip = styled.div`
  min-width: 24px;
  overflow: hidden;
  min-height: 24px;
  max-height: 24px;
  background-color: #4b5a6a;
  background-size: cover;
  border-radius: 40px;
  padding: 2px 2px;
  text-align: center;
  color: #000;
`;

const UserChips = styled.div`
  display: flex;
  flex-direction: row-reverse;
  ${Chip} {
    margin-left: -16px;
    font-size: 14px;
    text-align: center;
    display: flex;
    justify-content: center;
    align-items: center;
    color: #fff;
    &:last-child {
      margin-left: 0;
      font-size: 11px;
    }
  }
`;

const SettingsAndUsers = styled.div`
  background-color: ${(p) => p.theme.secondaryBackgroundColor};
  margin-right: 5px;
  padding: 0 6px;
  border-radius: 94px;
  display: flex;
  align-items: center;
  .gear {
    width: 24px;
    height: 24px;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: ${(p) => p.theme.chatbarSecondaryBackground};
    border-radius: 100%;

    svg path {
      fill: ${({ theme }) => theme.thirdFontColor};
    }
  }
`;

const EmojiList = styled.div`
  display: flex;
  font-size: 25px;
  width: 240px;
  justify-content: space-between;
  span {
    cursor: pointer;
    &::after {
      content: attr(data-emoji);
    }
  }
`;

const EmojiPickerStyled = styled.div`
  /* position: absolute;
  right: 51px;
  top: 11px; */
  z-index: 5;
  cursor: pointer;
`;

const ChatBarForm = styled.form<{ isSettings: boolean }>`
  padding: 0 9px;
  z-index: 3;
  margin: 0;
  transition: opacity 0.2s;
  position: relative;
  opacity: ${({ isSettings }) => (isSettings ? 0 : 1)};
`;

const ChatInputWrapper = styled.div`
  display: flex;
  position: relative;
`;

const ChatInput = styled.div<{ isConnected: boolean }>`
  display: grid;
  grid-template-columns: 1fr 18px auto auto;
  align-items: center;
  margin: 0;
  z-index: 3;
  transition: width 0.3s, opacity 0.3s;
  opacity: ${({ isConnected }) => (isConnected ? 1 : 0)};
  background-color: ${(p) => p.theme.secondaryBackgroundColor};
  border-radius: 94px;
  width: 100%;

  input {
    background-color: transparent;
    z-index: 2;
    font-size: 11.5px;
    font-weight: 400;
    border-radius: 6px;
    width: 100%;
    border: 0;
    padding: 12px 15px 12px 15px;
    height: 35px;
    outline: none;
    color: ${(p) => p.theme.fontColor};
    &::placeholder {
      color: ${(p) => p.theme.placeholder};
    }
  }

  button {
    border: 0;
    padding: 6px 5px;
    margin: 0;
    background-color: transparent;
    outline: none;
    cursor: pointer;
    &:hover {
      .icon {
        background-color: rgba(0, 0, 0, 0.06);
        cursor: pointer;
        border-radius: 5px;
      }
    }
  }
`;

const SendButton = styled.div`
  position: relative;
  display: flex;
  z-index: 3;
  cursor: pointer;
  margin: 0 4px;
  background-color: ${({ color }) => color};
  width: 27px;
  height: 27px;
  border-radius: 94px;
  justify-content: center;
  svg {
    align-self: center;
  }
`;
