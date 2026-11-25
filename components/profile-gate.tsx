"use client";

import { useState } from "react";
import { useApp } from "@/components/app-state";
import { Avatar } from "@/components/avatar";
import { PencilIcon } from "@/components/icons";
import { useModalDialog } from "@/components/use-dialog";
import { AVATARS, MAX_PROFILES, sanitizeName } from "@/lib/profiles";
import type { Profile } from "@/lib/types";

export function ProfileGate() {
  const { store, gateEditing, requestManage, finishManage, selectProfile, createProfile, renameProfile, changeAvatar, deleteProfile } = useApp();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Profile | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftAvatar, setDraftAvatar] = useState<string>(AVATARS[0].id);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");
  const addRef = useModalDialog(adding, () => setAdding(false));
  const editRef = useModalDialog(Boolean(editing), () => {
    setEditing(null);
    setConfirmDelete(false);
  });

  function openAdd() {
    setError("");
    setDraftName("");
    setDraftAvatar(AVATARS[store.profiles.length % AVATARS.length]?.id ?? "ember");
    setAdding(true);
  }

  function openEdit(profile: Profile) {
    setDraftName(profile.name);
    setDraftAvatar(profile.avatar);
    setConfirmDelete(false);
    setEditing(profile);
  }

  return (
    <div className="profile-gate">
      <p className="profile-gate-logo">CODYFLIX</p>
      <h1>Who’s watching?</h1>
      <p className="gate-note">Profiles, lists, and watch progress stay in this browser.</p>
      {!store.hydrated ? (
        <div className="profile-row" aria-hidden="true">
          <span className="profile-skeleton" />
          <span className="profile-skeleton" />
          <span className="profile-skeleton" />
        </div>
      ) : (
        <div className="profile-row">
          {store.profiles.map((profile) => (
            <button
              key={profile.id}
              type="button"
              className="profile-tile"
              onClick={() => (gateEditing ? openEdit(profile) : selectProfile(profile.id))}
            >
              <span className="avatar-wrap">
                <Avatar name={profile.name} avatar={profile.avatar} />
                {gateEditing ? (
                  <span className="avatar-edit">
                    <PencilIcon />
                  </span>
                ) : null}
              </span>
              <span className="name">{profile.name}</span>
            </button>
          ))}
          {store.profiles.length < MAX_PROFILES ? (
            <button type="button" className="profile-tile" onClick={openAdd}>
              <span className="avatar avatar-add" aria-hidden="true">
                +
              </span>
              <span className="name">Add Profile</span>
            </button>
          ) : (
            <p className="gate-cap">5 profiles max on this device.</p>
          )}
        </div>
      )}
      {store.hydrated && store.profiles.length > 0 ? (
        <button
          type="button"
          className="gate-manage"
          onClick={() => (gateEditing ? finishManage() : requestManage())}
        >
          {gateEditing ? "Done" : "Manage Profiles"}
        </button>
      ) : null}
      {error ? <p className="form-error">{error}</p> : null}

      <dialog ref={addRef} className="profile-dialog" closedby="any" aria-labelledby="add-profile-title">
        <form
          method="dialog"
          onSubmit={(event) => {
            const name = sanitizeName(draftName);
            if (!name) {
              event.preventDefault();
              setError("Enter a name.");
              return;
            }
            const created = createProfile({
              id: crypto.randomUUID(),
              name,
              avatar: draftAvatar,
            });
            if (!created) {
              event.preventDefault();
              setError("You can keep up to 5 profiles on this device.");
            }
          }}
        >
          <h2 id="add-profile-title">Add a profile</h2>
          <label htmlFor="new-profile-name">Name</label>
          <input
            id="new-profile-name"
            value={draftName}
            maxLength={18}
            autoComplete="nickname"
            required
            autoFocus
            onChange={(event) => setDraftName(event.target.value)}
          />
          <AvatarPicker selected={draftAvatar} onSelect={setDraftAvatar} />
          <div className="dialog-actions">
            <button type="button" className="btn btn-muted" onClick={() => addRef.current?.close()}>
              Cancel
            </button>
            <button type="submit" className="btn">
              Save
            </button>
          </div>
        </form>
      </dialog>

      <dialog ref={editRef} className="profile-dialog" closedby="any" aria-labelledby="edit-profile-title">
        {editing ? (
          <form
            method="dialog"
            onSubmit={(event) => {
              if (confirmDelete) {
                event.preventDefault();
                return;
              }
              const name = sanitizeName(draftName);
              if (!name) {
                event.preventDefault();
                return;
              }
              renameProfile(editing.id, name);
              changeAvatar(editing.id, draftAvatar);
            }}
          >
            <h2 id="edit-profile-title">Edit profile</h2>
            <label htmlFor="edit-profile-name">Name</label>
            <input
              id="edit-profile-name"
              value={draftName}
              maxLength={18}
              autoComplete="nickname"
              required
              onChange={(event) => setDraftName(event.target.value)}
            />
            <AvatarPicker selected={draftAvatar} onSelect={setDraftAvatar} />
            {confirmDelete ? (
              <p className="form-error" id="delete-warning">
                Remove {editing.name}? Their list and progress on this device will be deleted.
              </p>
            ) : null}
            <div className="dialog-actions">
              {confirmDelete ? (
                <>
                  <button type="button" className="btn btn-muted" onClick={() => setConfirmDelete(false)}>
                    Keep
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    aria-describedby="delete-warning"
                    onClick={() => {
                      deleteProfile(editing.id);
                      editRef.current?.close();
                    }}
                  >
                    Remove
                  </button>
                </>
              ) : (
                <>
                  {store.profiles.length > 1 ? (
                    <button type="button" className="btn btn-danger" onClick={() => setConfirmDelete(true)}>
                      Delete
                    </button>
                  ) : null}
                  <button type="submit" className="btn">
                    Save
                  </button>
                </>
              )}
            </div>
          </form>
        ) : null}
      </dialog>
    </div>
  );
}

function AvatarPicker({ selected, onSelect }: { selected: string; onSelect: (id: string) => void }) {
  return (
    <div className="avatar-picker" role="group" aria-label="Avatar">
      {AVATARS.map((avatar) => (
        <button
          key={avatar.id}
          type="button"
          className={selected === avatar.id ? "is-selected" : ""}
          aria-pressed={selected === avatar.id}
          aria-label={`${avatar.id} avatar`}
          onClick={() => onSelect(avatar.id)}
        >
          <span style={{ background: avatar.background }} />
        </button>
      ))}
    </div>
  );
}
