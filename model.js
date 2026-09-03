const model = {
  schema_version: "1.1",
  type_definitions: [
    { type: "user" },
    { type: "agent" },
    {
      type: "tool",
      relations: {
        executor: { this: {} },
        can_execute: {
          computedUserset: { relation: "executor", object: "" },
        },
      },
      metadata: {
        relations: {
          executor: { directly_related_user_types: [{ type: "agent" }] },
        },
      },
    },
    {
      type: "developer_org",
      relations: {
        admin: { this: {} },
        member: { this: {} },
      },
      metadata: {
        relations: {
          admin: { directly_related_user_types: [{ type: "user" }] },
          member: { directly_related_user_types: [{ type: "user" }] },
        },
      },
    },
    {
      type: "cp_org",
      relations: { member: { this: {} } },
      metadata: {
        relations: {
          member: { directly_related_user_types: [{ type: "user" }] },
        },
      },
    },
    {
      type: "project",
      relations: {
        owner_org: { this: {} },
        assigned_cp: { this: {} },
        can_control: {
          union: {
            child: [
              {
                tupleToUserset: {
                  tupleset: { relation: "owner_org" },
                  computedUserset: { relation: "admin", object: "owner_org" },
                },
              },
              {
                tupleToUserset: {
                  tupleset: { relation: "owner_org" },
                  computedUserset: { relation: "member", object: "owner_org" },
                },
              },
            ],
          },
        },
        can_edit: { computedUserset: { relation: "can_control", object: "" } },
        can_delete: { computedUserset: { relation: "can_control", object: "" } },
        can_view: {
          union: {
            child: [
              { computedUserset: { relation: "can_control", object: "" } },
              {
                tupleToUserset: {
                  tupleset: { relation: "assigned_cp" },
                  computedUserset: {
                    relation: "member",
                    object: "assigned_cp",
                  },
                },
              },
            ],
          },
        },
      },
      metadata: {
        relations: {
          owner_org: {
            directly_related_user_types: [{ type: "developer_org" }],
          },
          assigned_cp: { directly_related_user_types: [{ type: "cp_org" }] },
        },
      },
    },
  ],
};

module.exports = model;
