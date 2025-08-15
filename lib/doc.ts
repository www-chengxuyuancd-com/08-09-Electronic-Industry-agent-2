export const dbSchema = `
\`\`\`sql
create schema assessment;

create schema assessment_profile;

create schema platform_management;

create table platform_management.assignment
(
    id                    bigserial
        primary key,
    assignment_id         integer
        constraint uk_69g7kc6aba38ao4e3el6wmf6l
            unique,
    effort                integer,
    assignment_end_date   date,
    opportunity_id        varchar(255),
    shadow                boolean,
    staffing_request_id   varchar(255),
    assignment_start_date date,
    status                boolean,
    employee_id           varchar(255)
);

create table platform_management."user"
(
    id          bigserial
        primary key,
    created_at  timestamp,
    email       varchar(255)
        constraint uk_ob8kqyqqgmefl0aco34akdtpe
            unique,
    employee_id varchar(255)
        constraint uk_r1usl9qoplqsbrhha5e0niqng
            unique,
    is_active   boolean,
    name        varchar(255),
    updated_at  timestamp
);

create table assessment.assessment
(
    id                         bigserial
        primary key,
    status                     varchar(255),
    account_id                 bigint,
    additional_comment         varchar(255),
    assessment_profile_id      bigint,
    created_at                 timestamp,
    due_date                   date,
    market_id                  bigint,
    name                       varchar(255),
    project_id                 bigint,
    review_by                  varchar(255),
    reviewed_at                date,
    risk                       varchar(255),
    score                      double precision,
    submitted_at               date,
    submitted_by               varchar(255),
    updated_at                 timestamp,
    assessment_profile_version bigint,
    triggered_by               varchar(255),
    old_score                  double precision,
    send_reminder              boolean default false,
    completed_at               timestamp,
    completed_by               varchar(255),
    is_self_assessment         boolean,
    org_market_id              varchar,
    squad_id                   bigint
);

create table assessment.action_item
(
    id              bigserial
        primary key,
    assigned_to     varchar(255),
    created_at      timestamp,
    due_date        date,
    description     text,
    status          varchar(255),
    updated_at      timestamp,
    assessment_id   bigint
        constraint fkpyawk0l2sslh5j2hnco4txg57
            references assessment.assessment,
    priority        varchar(255),
    question_title  text,
    section_title   text,
    title           text,
    triggered_by    varchar,
    is_auto_created boolean,
    closed_by       varchar(255),
    closed_at       timestamp,
    constraint ukaedgonp85kaaccjo1rxjgp4o5
        unique (assessment_id, section_title, question_title, title, description)
);

create index action_item_table_assessment_and_status_index
    on assessment.action_item (assessment_id asc, status asc, updated_at desc);

create table assessment.action_item_comment
(
    id             bigserial
        primary key,
    comment_text   varchar,
    created_at     timestamp,
    user_email     varchar(255),
    action_item_id bigint
        constraint fk5q7xiq94tinl42hnskt1eduuq
            references assessment.action_item
);

create table assessment.action_item_comment_attachments
(
    id                     bigserial
        primary key,
    file_size              bigint       not null,
    file_name              varchar(255) not null,
    action_item_comment_id bigint       not null
        constraint fkofpp2muynqfjjyj7ndg4pwoud
            references assessment.action_item_comment
);

create table assessment.answer
(
    id            bigserial
        primary key,
    created_at    timestamp,
    is_na         boolean default false,
    option_id     bigint,
    question_id   bigint,
    score         double precision,
    updated_at    timestamp,
    assessment_id bigint
        constraint fk43trb1qe9ybh2a3yt017fn415
            references assessment.assessment,
    old_score     double precision,
    constraint ukcnvhp5pxwu1c5xww0xcu5ch6i
        unique (question_id, assessment_id)
);

create index answer_table_assessment_and_question_id_index
    on assessment.answer (assessment_id, question_id);

create index assessment_table_account_id_index
    on assessment.assessment (account_id);

create index assessment_table_project_id_index
    on assessment.assessment (project_id);

create table assessment.assessment_clt
(
    id            bigserial
        primary key,
    created_at    timestamp,
    updated_at    timestamp,
    user_id       bigint,
    assessment_id bigint
        constraint fkqn3p0a9t3cvm4vn8uoevqwbbn
            references assessment.assessment,
    constraint ukk2veg9sft40j9xj8rkcwhhvt3
        unique (user_id, assessment_id)
);

create index assessment_clt_table_assessment_and_user_id_index
    on assessment.assessment_clt (assessment_id, user_id);

create table assessment.assessment_email_reminder
(
    id              bigserial
        primary key,
    assessment_id   bigint,
    health_facet_id bigint,
    is_overdue_date boolean default false,
    reminder_date   date
);

create table assessment.assessment_history
(
    id            bigserial
        primary key,
    created_at    timestamp,
    status        varchar(255),
    updated_at    timestamp,
    version       varchar(255),
    assessment_id bigint
        constraint fk6rmjpvby2k00ayskordo5w8o6
            references assessment.assessment
);

create table platform_management.account
(
    id                     bigserial
        primary key,
    code                   varchar(255)
        constraint unique_account_code
            unique,
    created_at             timestamp,
    name                   varchar(255),
    non_assessment_account boolean default false,
    status                 varchar default 'Active'::character varying,
    updated_at             timestamp,
    new_market_id          varchar,
    opportunity_count      bigint
);

create table platform_management.project
(
    id                        bigserial
        primary key,
    created_at                timestamp,
    end_date                  date,
    is_internal               boolean default true,
    is_non_assessment_project boolean default false,
    name                      varchar(255),
    project_id                varchar(255),
    start_date                date,
    status                    varchar default 'Active'::character varying,
    updated_at                timestamp,
    account_id                bigint
        constraint fkt75uy6hdr646hum7eqvwm9slj
            references platform_management.account,
    opportunity_id            varchar(255)
);

create index idx_project_opportunity_id
    on platform_management.project (opportunity_id);

create index project_table_id_index
    on platform_management.project (id) include (name);

create index account_table_id_index
    on platform_management.account (id) include (name);

create table platform_management.health_facet
(
    id          bigserial
        primary key,
    created_at  timestamp,
    description varchar(255),
    is_active   boolean,
    name        varchar(255)
        constraint ukng8dvvt3kfg0f4cl5p4l9dton
            unique,
    updated_at  timestamp
);

create table platform_management.org_market
(
    id         varchar(255) not null
        primary key,
    name       varchar(255),
    region_id  varchar(255),
    created_at timestamp,
    updated_at timestamp
);

create index idx_org_market_id
    on platform_management.org_market (id);

create table platform_management.squad
(
    id                bigserial
        primary key,
    sf_id             text                   not null
        constraint unique_squad
            unique,
    sf_account_id     text                   not null,
    name              text                   not null,
    description       text,
    is_active         boolean   default true not null,
    owner_employee_id text,
    created_at        timestamp default CURRENT_TIMESTAMP,
    created_by        text,
    updated_at        timestamp default CURRENT_TIMESTAMP,
    updated_by        text
);

create table assessment.assessment_reminder_health_facet_config
(
    id                  bigserial
        primary key,
    assessment_status   character varying[],
    health_facet_id     bigint,
    overdue_ageing      bigint,
    reminder_percentage integer[]
);

create table assessment.assessment_report
(
    id                         bigserial
        primary key,
    account_name               varchar(255),
    action_item_description    varchar,
    action_item_status         varchar(255),
    additional_comment         varchar,
    assessment_id              bigint,
    assessment_profile_name    varchar(255),
    assessment_user_name       varchar(255),
    comment_text               varchar,
    created_at                 timestamp,
    due_date                   date,
    health_facet_name          varchar(255),
    market_name                varchar(255),
    project_name               varchar(255),
    question_id                bigint,
    question_risk              varchar(255),
    question_score             double precision,
    question_title             varchar,
    review_by                  varchar(255),
    reviewed_at                timestamp,
    risk                       varchar(255),
    score                      double precision,
    section_name               varchar(255),
    selected_option_title      varchar,
    status                     varchar(255),
    submitted_at               timestamp,
    submitted_by               varchar(255),
    updated_at                 timestamp,
    account_id                 bigint,
    action_item_id             bigint,
    market_id                  bigint,
    action_item_due_date       date,
    triggered_date             date,
    section_id                 bigint,
    section_score              double precision,
    action_item_assigned_to    varchar(255),
    action_item_updated_at     timestamp,
    action_item_created_at     timestamp,
    action_item_priority       varchar(255),
    action_item_question_title varchar(255),
    action_item_section_title  varchar(255),
    action_item_title          varchar(255),
    old_assessment_score       double precision,
    old_section_score          double precision,
    assessment_teams_id        bigint,
    team_name                  varchar(255)
);

create table assessment.assessment_teams
(
    id               bigserial
        primary key,
    team_assignee_id bigint,
    team_name        varchar(255),
    assessment_id    bigint
        constraint fk20hb7l1hy6kt7b7wbeean0jbn
            references assessment.assessment
);

create table assessment.assessment_user
(
    id            bigserial
        primary key,
    created_at    timestamp,
    updated_at    timestamp,
    user_id       bigint,
    assessment_id bigint
        constraint fknr01tcnaokr4pyc6mxcuu8tfi
            references assessment.assessment
);

create table assessment.comment
(
    id            bigserial
        primary key,
    comment_text  varchar,
    created_at    timestamp,
    question_id   bigint,
    updated_at    timestamp,
    assessment_id bigint
        constraint fkmeff3jk8ek5qd72jxvxnnvqj7
            references assessment.assessment,
    constraint uknpg7pox0dxvdv3ht208cr0xpr
        unique (assessment_id, question_id)
);

create index comment_table_assessment_and_question_id_index
    on assessment.comment (assessment_id, question_id) include (id, comment_text);

create table assessment.rag_account_setting
(
    id               bigserial
        primary key,
    facet            text    not null,
    account_id       bigint  not null,
    project_id       bigint,
    squad_id         bigint,
    is_rag_disabled  boolean not null,
    created_at       timestamp default CURRENT_TIMESTAMP,
    created_by       text,
    updated_at       timestamp default CURRENT_TIMESTAMP,
    updated_by       text,
    reporter_ids     bigint[]  default '{}'::bigint[],
    cycle_start_date text      default '2024-07-01'::text,
    constraint unique_project_setting
        unique (facet, project_id, cycle_start_date),
    constraint unique_squad_setting
        unique (facet, squad_id, cycle_start_date)
);

create table platform_management.opportunity
(
    id                bigserial
        primary key,
    opportunity_sf_id text not null
        unique,
    account_sf_id     text,
    project_sf_id     text,
    name              text not null,
    stage             text,
    probability       integer,
    close_date        date,
    start_date        date,
    end_date          date,
    created_at        timestamp   default CURRENT_TIMESTAMP,
    created_by        text,
    updated_at        timestamp   default CURRENT_TIMESTAMP,
    updated_by        text,
    amount            numeric,
    extended_from     varchar(20) default NULL::character varying,
    is_damo_service   boolean
);

create table assessment.rag_cycle
(
    id         bigserial
        primary key,
    facet      text not null,
    start_date text not null,
    end_date   text not null,
    constraint unique_facet_cycle
        unique (facet, start_date, end_date)
);

create table assessment.rag_assessment
(
    id               bigserial
        primary key,
    facet            text   not null,
    account_id       bigint not null,
    project_id       bigint,
    squad_id         bigint,
    cycle_start_date text   not null,
    cycle_end_date   text   not null,
    submitted_at     timestamp default CURRENT_TIMESTAMP,
    submitted_by     text,
    created_at       timestamp default CURRENT_TIMESTAMP,
    created_by       text,
    updated_at       timestamp default CURRENT_TIMESTAMP,
    updated_by       text,
    constraint unique_project_cycle_assessment
        unique (facet, project_id, cycle_start_date, cycle_end_date),
    constraint unique_squad_cycle_assessment
        unique (facet, squad_id, cycle_start_date, cycle_end_date)
);

create table assessment.escalation_and_monthly_report_email_config
(
    id                    bigserial
        primary key,
    assessment_status     varchar(255),
    facet                 varchar(255),
    send_escalation_email boolean,
    escalation_aging      bigint,
    send_monthly_report   boolean,
    monthly_report_aging  bigint
);

create table assessment.flyway_schema_history
(
    installed_rank integer                 not null
        constraint flyway_schema_history_pk
            primary key,
    version        varchar(50),
    description    varchar(200)            not null,
    type           varchar(20)             not null,
    script         varchar(1000)           not null,
    checksum       integer,
    installed_by   varchar(100)            not null,
    installed_on   timestamp default now() not null,
    execution_time integer                 not null,
    success        boolean                 not null
);

create index flyway_schema_history_s_idx
    on assessment.flyway_schema_history (success);

create table assessment.grading_mechanism
(
    id         bigserial
        primary key,
    created_at timestamp,
    method     varchar(255),
    risk       varchar(255),
    score_from double precision,
    score_to   double precision,
    updated_at timestamp
);

create table assessment.project_asp_associate
(
    id                    bigserial
        primary key,
    assessment_profile_id bigint not null,
    current_associate_id  bigint not null,
    default_associate_id  bigint,
    project_id            bigint not null
);

create table assessment.rag_account_setting_reporter
(
    id                     bigserial
        primary key,
    user_id                bigint                 not null,
    rag_account_setting_id bigint                 not null,
    is_active              boolean   default true not null,
    created_at             timestamp default CURRENT_TIMESTAMP,
    created_by             text,
    updated_at             timestamp default CURRENT_TIMESTAMP,
    updated_by             text,
    constraint unique_reporter_rag_account_setting
        unique (user_id, rag_account_setting_id)
);

create table assessment.rag_answer
(
    id                bigserial
        primary key,
    rag_assessment_id bigint not null,
    rag_section_id    bigint not null,
    selected_rank     text   not null,
    notes             text,
    created_at        timestamp default CURRENT_TIMESTAMP,
    created_by        text,
    updated_at        timestamp default CURRENT_TIMESTAMP,
    updated_by        text,
    constraint unique_section_answer
        unique (rag_assessment_id, rag_section_id, selected_rank)
);

create table assessment.rag_assessment_draft
(
    id               bigserial
        primary key,
    facet            text not null,
    project_id       bigint,
    squad_id         bigint,
    json_data        text not null,
    cycle_start_date text not null,
    cycle_end_date   text not null,
    created_at       timestamp default CURRENT_TIMESTAMP,
    created_by       text,
    updated_at       timestamp default CURRENT_TIMESTAMP,
    updated_by       text,
    constraint unique_project_cycle_assessment_draft
        unique (facet, project_id, cycle_start_date, cycle_end_date),
    constraint unique_squad_cycle_assessment_draft
        unique (facet, squad_id, cycle_start_date, cycle_end_date)
);

create table assessment.rag_section
(
    id            bigserial
        primary key,
    facet         text                   not null,
    name          text                   not null,
    question      text                   not null,
    display_order integer                not null,
    is_active     boolean   default true not null,
    created_at    timestamp default CURRENT_TIMESTAMP,
    created_by    text,
    updated_at    timestamp default CURRENT_TIMESTAMP,
    updated_by    text,
    constraint unique_facet_section
        unique (facet, name)
);

create table assessment.rag_market_setting
(
    id          bigserial
        primary key,
    facet       text not null,
    market_id   text not null,
    market_name text not null,
    status      text not null,
    created_at  timestamp default CURRENT_TIMESTAMP,
    created_by  text,
    updated_at  timestamp default CURRENT_TIMESTAMP,
    updated_by  text,
    constraint unique_facet_market_id
        unique (facet, market_id)
);

create table assessment.rag_section_definition
(
    id             bigserial
        primary key,
    rag_section_id bigint                 not null,
    rank           text                   not null,
    meaning        text                   not null,
    is_active      boolean   default true not null,
    created_at     timestamp default CURRENT_TIMESTAMP,
    created_by     text,
    updated_at     timestamp default CURRENT_TIMESTAMP,
    updated_by     text,
    constraint unique_section_definition
        unique (rag_section_id, rank)
);

create table assessment.score
(
    id            bigserial
        primary key,
    score         double precision,
    created_at    timestamp,
    risk          varchar(255),
    section_id    bigint,
    updated_at    timestamp,
    assessment_id bigint
        constraint fkj2t996tvl0ocak4p4k7n7lfi3
            references assessment.assessment,
    old_score     double precision,
    constraint uk9uarg46354qiu5u07yc2vxet4
        unique (section_id, assessment_id)
);

create index score_table_assessment_id_index
    on assessment.score (assessment_id) include (section_id, score);

create table assessment_profile.flyway_schema_history
(
    installed_rank integer                 not null
        constraint flyway_schema_history_pk
            primary key,
    version        varchar(50),
    description    varchar(200)            not null,
    type           varchar(20)             not null,
    script         varchar(1000)           not null,
    checksum       integer,
    installed_by   varchar(100)            not null,
    installed_on   timestamp default now() not null,
    execution_time integer                 not null,
    success        boolean                 not null
);

create index flyway_schema_history_s_idx
    on assessment_profile.flyway_schema_history (success);

create table assessment_profile.frequency
(
    id         bigserial
        primary key,
    created_at timestamp,
    end_date   timestamp,
    start_date timestamp,
    type       varchar(255),
    updated_at timestamp
);

create table assessment_profile.assessment_profile
(
    id                           bigserial
        primary key,
    created_at                   timestamp,
    description                  text,
    grading_method               varchar(255),
    health_facet_id              bigint,
    last_saved_phase             varchar(255),
    level                        varchar(255),
    name                         varchar(255),
    state                        varchar(255),
    updated_at                   timestamp,
    frequency_id                 bigint
        constraint fkc8ktveg0ba3ltswls22nxstr6
            references assessment_profile.frequency,
    is_auto_convertable          boolean,
    is_auto_update_risk_severity boolean default false,
    send_reminder                boolean default false,
    modified_by                  varchar,
    is_self_assessment           boolean
);

create table assessment_profile.assessment_profile_market
(
    id                    bigserial
        primary key,
    created_at            timestamp,
    market_id             bigint,
    updated_at            timestamp,
    assessment_profile_id bigint
        constraint fk83r5y6mrml70mdm3lib07dbm0
            references assessment_profile.assessment_profile
);

create table assessment_profile.assessment_profile_org_market
(
    id                    bigserial
        primary key,
    org_market_id         varchar(255) not null,
    created_at            timestamp,
    updated_at            timestamp,
    assessment_profile_id bigint
        constraint fkea771g6w9emre52fum3gj2fup
            references assessment_profile.assessment_profile
);

create table assessment_profile.assessment_profile_version
(
    id                           bigserial
        primary key,
    created_at                   timestamp,
    description                  text,
    grading_mechanism_id         bigint,
    health_facet_id              bigint,
    is_active                    boolean,
    level                        varchar(255),
    market_id                    bigint,
    name                         varchar(255),
    state                        varchar(255),
    updated_at                   timestamp,
    updated_by                   varchar(255),
    version                      bigint,
    assessment_profile_id        bigint
        constraint fk5noms7t0n01dbbqsrhy1y8lay
            references assessment_profile.assessment_profile,
    grading_method               varchar(255),
    last_saved_phase             varchar(255),
    frequency_id                 bigint
        constraint fk2tx6e5nbxjpbrh9be7v7fbnyi
            references assessment_profile.frequency,
    is_auto_convertable          boolean,
    is_auto_update_risk_severity boolean default false,
    send_reminder                boolean default false,
    is_self_assessment           boolean default false,
    constraint unique_version_number_and_profile_id
        unique (version, assessment_profile_id)
);

create index assessment_profile_version_table_profile_id_and_version_index
    on assessment_profile.assessment_profile_version (assessment_profile_id, version);

create table assessment_profile.assessment_profile_version_market
(
    id                            bigserial
        primary key,
    created_at                    timestamp,
    market_id                     bigint,
    updated_at                    timestamp,
    assessment_profile_version_id bigint
        constraint fk5u2qyckdlf34f5tiovmwh59ru
            references assessment_profile.assessment_profile_version
);

create table assessment_profile.assessment_profile_version_org_market
(
    id                            bigserial
        primary key,
    org_market_id                 varchar(255) not null,
    created_at                    timestamp,
    updated_at                    timestamp,
    assessment_profile_version_id bigint
        constraint fkrxjkrl78wlrdf1c57ttggmqdc
            references assessment_profile.assessment_profile_version
);

create table assessment_profile.question_bank
(
    id                 bigserial
        primary key,
    created_at         timestamp,
    description        varchar(255),
    question_bank_name varchar(255),
    question_name      varchar,
    updated_at         timestamp
);

create table assessment_profile.question
(
    id                         bigserial
        primary key,
    choice_type                varchar(255),
    comments_required          boolean default false,
    created_at                 timestamp,
    description                varchar,
    title                      varchar,
    updated_at                 timestamp,
    question_bank_id           bigint
        constraint fkejbwnygbsv82ocl8dq6o2k6yq
            references assessment_profile.question_bank,
    comment_mandatory          boolean default false,
    is_non_assessment_question boolean default false
);

create table assessment_profile.option
(
    id                     bigserial
        primary key,
    created_at             timestamp,
    description            varchar,
    has_conditional_branch boolean default false,
    is_na                  boolean default false,
    option_order           integer default 0,
    risk                   varchar(255),
    title                  varchar,
    updated_at             timestamp,
    question_id            bigint
        constraint fkgtlhwmagte7l2ssfsgw47x9ka
            references assessment_profile.question,
    has_suggestive_action  boolean default false
);

create table assessment_profile.conditional_branch
(
    id                   bigserial
        primary key,
    child_question_order integer,
    created_at           timestamp,
    updated_at           timestamp,
    answered_question_id bigint
        constraint fkhlc32y2bl5oidxpc7b0tlv0o5
            references assessment_profile.question,
    next_question_id     bigint
        constraint fke4gk57ofgmyg5myff9xu0ic49
            references assessment_profile.question,
    option_id            bigint
        constraint fkbkqmjjskgg874aima8n4liky7
            references assessment_profile.option
);

create table assessment_profile.section
(
    id          bigserial
        primary key,
    created_at  timestamp,
    description varchar(255),
    name        varchar(255),
    updated_at  timestamp
);

create table assessment_profile.assessment_profile_section
(
    id                    bigserial
        primary key,
    created_at            timestamp,
    section_order         integer default 0,
    updated_at            timestamp,
    weightage             double precision,
    assessment_profile_id bigint
        constraint fk5omaugl3l45x531krkywmfw8v
            references assessment_profile.assessment_profile,
    section_id            bigint
        constraint fks6v3jgwbgcbp8a5yhhlu2bbur
            references assessment_profile.section
);

create table assessment_profile.assessment_profile_section_question
(
    id                    bigserial
        primary key,
    created_at            timestamp,
    question_order        integer default 0,
    updated_at            timestamp,
    assessment_profile_id bigint
        constraint fknws1w639htyixphm4cjyvhk1m
            references assessment_profile.assessment_profile,
    question_id           bigint
        constraint fka7vncd5o7a3yfhmf4txrdsmtg
            references assessment_profile.question,
    section_id            bigint
        constraint fkhng9cy5pewv12wtvmua2prfhb
            references assessment_profile.section
);

create table assessment_profile.suggestive_action
(
    id          bigserial
        primary key,
    created_at  timestamp,
    description varchar,
    title       varchar,
    updated_at  timestamp
);

create table assessment_profile.option_suggestive_action
(
    id                      bigserial
        primary key,
    created_at              timestamp,
    suggestive_action_order integer default 0,
    updated_at              timestamp,
    option_id               bigint
        constraint fkrvxorv4203r846n1tuxijfhsw
            references assessment_profile.option,
    suggestive_action_id    bigint
        constraint fkmau2gr0l1qvjn15jdybnjiujv
            references assessment_profile.suggestive_action
);

create table assessment_profile.version_question
(
    id                         bigserial
        primary key,
    choice_type                varchar(255),
    comments_required          boolean default false,
    created_at                 timestamp,
    description                varchar,
    title                      varchar,
    updated_at                 timestamp,
    comment_mandatory          boolean default false,
    is_non_assessment_question boolean default false
);

create table assessment_profile.version_option
(
    id                     bigserial
        primary key,
    created_at             timestamp,
    description            varchar,
    has_conditional_branch boolean default false,
    is_na                  boolean default false,
    option_order           integer default 0,
    risk                   varchar(255),
    title                  varchar,
    updated_at             timestamp,
    question_id            bigint
        constraint fkgetxp21y8pnjs0da10xf2tuue
            references assessment_profile.version_question,
    has_suggestive_action  boolean default false
);

create table assessment_profile.version_conditional_branch
(
    id                   bigserial
        primary key,
    child_question_order integer,
    created_at           timestamp,
    updated_at           timestamp,
    answered_question_id bigint
        constraint fk7ifs060iv6cph9fwh7e9tlj2k
            references assessment_profile.version_question,
    next_question_id     bigint
        constraint fk4vujo0b4ti1pexgpra3rdnvhh
            references assessment_profile.version_question,
    option_id            bigint
        constraint fkd2e0pppni9q56k3qm1wbt9mpy
            references assessment_profile.version_option
);

create index version_conditional_branch_table_answered_question_id_index
    on assessment_profile.version_conditional_branch (answered_question_id);

create index version_conditional_branch_table_next_question_id_index
    on assessment_profile.version_conditional_branch (next_question_id);

create index version_option_table_question_id_index
    on assessment_profile.version_option (question_id);

create table assessment_profile.version_section
(
    id          bigserial
        primary key,
    created_at  timestamp,
    description varchar(255),
    name        varchar(255),
    updated_at  timestamp
);

create table assessment_profile.assessment_profile_version_section
(
    id                            bigserial
        primary key,
    created_at                    timestamp,
    section_order                 integer default 0,
    updated_at                    timestamp,
    weightage                     double precision,
    assessment_profile_version_id bigint
        constraint fk2dpn2jn8wd3q314qmvh90b82t
            references assessment_profile.assessment_profile_version,
    version_section_id            bigint
        constraint fkavk7670yduk17ppx17ppdhjkh
            references assessment_profile.version_section
);

create index assessment_profile_version_section_table_apv_id_index
    on assessment_profile.assessment_profile_version_section (assessment_profile_version_id);

create table assessment_profile.assessment_profile_version_section_question
(
    id                            bigserial
        primary key,
    created_at                    timestamp,
    question_order                integer default 0,
    updated_at                    timestamp,
    assessment_profile_version_id bigint
        constraint fko79m2bixyk89x15h8fyct3j7n
            references assessment_profile.assessment_profile_version,
    question_id                   bigint
        constraint fke65hren3j4mwkiqs5yfp7tj96
            references assessment_profile.version_question,
    section_id                    bigint
        constraint fktb81ocycrrpdh1q3482m07upr
            references assessment_profile.version_section
);

create index assessment_profile_version_section_question_table_apv_id_index
    on assessment_profile.assessment_profile_version_section_question (assessment_profile_version_id);

create table assessment_profile.version_suggestive_action
(
    id          bigserial
        primary key,
    created_at  timestamp,
    description varchar,
    title       varchar,
    updated_at  timestamp
);

create table assessment_profile.version_option_suggestive_action
(
    id                           bigserial
        primary key,
    created_at                   timestamp,
    suggestive_action_order      integer default 0,
    updated_at                   timestamp,
    version_option_id            bigint
        constraint fknscgudmhkbyqk5r8kki14j0ui
            references assessment_profile.version_option,
    version_suggestive_action_id bigint
        constraint fkkwxcjrxwkb21xcp176isnl9uq
            references assessment_profile.version_suggestive_action
);

create index version_option_suggestive_action_table_version_option_id_index
    on assessment_profile.version_option_suggestive_action (version_option_id);

create table platform_management.account_team_member
(
    id         bigserial
        primary key,
    user_id    bigint                  not null,
    account_id bigint                  not null,
    is_clt     boolean   default false not null,
    is_active  boolean   default true  not null,
    created_at timestamp default CURRENT_TIMESTAMP,
    created_by text,
    updated_at timestamp default CURRENT_TIMESTAMP,
    updated_by text,
    constraint unique_user_account_team_member
        unique (user_id, account_id)
);

create table platform_management.delivery_unit
(
    id    bigserial
        primary key,
    sf_id varchar(255) not null
        constraint unique_delivery_unit_sf_id
            unique,
    name  varchar(255) not null
);

create index idx_delivery_unit_sf_id
    on platform_management.delivery_unit (sf_id);

create table platform_management.flyway_schema_history
(
    installed_rank integer                 not null
        constraint flyway_schema_history_pk
            primary key,
    version        varchar(50),
    description    varchar(200)            not null,
    type           varchar(20)             not null,
    script         varchar(1000)           not null,
    checksum       integer,
    installed_by   varchar(100)            not null,
    installed_on   timestamp default now() not null,
    execution_time integer                 not null,
    success        boolean                 not null
);

create index flyway_schema_history_s_idx
    on platform_management.flyway_schema_history (success);

create table platform_management.job_log
(
    id            bigserial
        primary key,
    name          text not null,
    status        text not null,
    start_time    timestamp default CURRENT_TIMESTAMP,
    end_time      timestamp default CURRENT_TIMESTAMP,
    error_message text,
    triggered_by  text
);

create table platform_management.notification_log
(
    id            bigserial
        primary key,
    title         text not null,
    template_name text not null,
    source_data   text,
    content       text,
    send_time     timestamp default CURRENT_TIMESTAMP,
    from_email    text not null,
    to_emails     text,
    cc_emails     text,
    status        boolean,
    comment       text,
    triggered_by  text
);

create table platform_management.opportunity_service_line
(
    id             bigserial
        primary key,
    code           varchar(255),
    name           varchar(255),
    opportunity_id bigint,
    created_at     timestamp default CURRENT_TIMESTAMP,
    created_by     text,
    updated_at     timestamp default CURRENT_TIMESTAMP,
    updated_by     text,
    constraint unique_opportunity_id_service_line_code
        unique (opportunity_id, code)
);

create table platform_management.opportunity_snapshot
(
    id                bigserial
        primary key,
    opportunity_sf_id text not null,
    name              text,
    project_sf_id     text,
    start_date        date,
    end_date          date,
    probability       integer,
    stage             text,
    amount            numeric,
    snapshot_date     date default CURRENT_DATE
);

create index idx_opportunity_snapshot_snapshot_date
    on platform_management.opportunity_snapshot (snapshot_date);

create table platform_management.org_region
(
    id         varchar(255) not null
        primary key,
    name       varchar(255),
    created_at timestamp,
    updated_at timestamp
);

create index idx_org_region_id
    on platform_management.org_region (id);

create table platform_management.organizational_structure
(
    id                      varchar(255) not null
        primary key,
    org_unit_name           varchar(255),
    org_type                varchar(255),
    parent_id               varchar(255),
    org_unit_parent_name    varchar(255),
    belongs_to_geography_id varchar(255),
    belongs_to_geographies  varchar(255),
    owns_clients            varchar(255),
    delivery_unit           varchar(255),
    status                  varchar(255),
    activated_date          varchar(255),
    deactivated_date        varchar(255),
    comments                varchar(255)
);

create index idx_organizational_structure_id
    on platform_management.organizational_structure (id);

create table platform_management.project_snapshot
(
    id            bigserial
        primary key,
    project_id    bigserial,
    name          text not null,
    start_date    date not null,
    end_date      date not null,
    snapshot_date date default CURRENT_DATE
);

create table platform_management.role
(
    id         bigserial
        primary key,
    code       bigint,
    created_at timestamp,
    is_active  boolean,
    name       varchar(255)
        constraint uk8sewwnpamngi6b1dwaa88askk
            unique,
    updated_at timestamp
);

create table platform_management.staffing_request
(
    id               bigserial
        primary key,
    sf_id            varchar(255) not null
        constraint unique_staffing_request_sf_id
            unique,
    opportunity_id   varchar(255) not null,
    delivery_unit_id varchar(255),
    start_date       date         not null,
    end_date         date         not null
);

create index idx_staffing_request
    on platform_management.staffing_request (sf_id, delivery_unit_id, opportunity_id, start_date, end_date);

create table platform_management.user_admin
(
    id         bigint not null
        primary key,
    user_id    bigint,
    created_at timestamp,
    updated_at timestamp,
    updated_by varchar(255),
    is_active  boolean
);

create table platform_management.user_config
(
    id          bigserial
        primary key,
    user_id     bigint not null,
    config_name text   not null,
    json_data   text   not null,
    created_at  timestamp default CURRENT_TIMESTAMP,
    created_by  text,
    updated_at  timestamp default CURRENT_TIMESTAMP,
    updated_by  text,
    constraint unique_user_config
        unique (user_id, config_name)
);

create table platform_management.user_health_facet
(
    id              bigserial
        primary key,
    created_at      timestamp,
    is_active       boolean,
    updated_at      timestamp,
    health_facet_id bigint
        constraint fkq4129bkrloa51eygwruyb97gc
            references platform_management.health_facet,
    user_id         bigint
        constraint fks9l3agqy0fl2ey7sf646j6po6
            references platform_management."user"
);

create table platform_management.user_market_permission
(
    id         bigserial
        primary key,
    user_id    bigint                 not null,
    market_id  text                   not null,
    role_name  text                   not null,
    permission text                   not null,
    is_active  boolean   default true not null,
    created_at timestamp default CURRENT_TIMESTAMP,
    created_by text,
    updated_at timestamp default CURRENT_TIMESTAMP,
    updated_by text,
    constraint unique_user_market_permission_fields
        unique (user_id, market_id, role_name, permission)
);

create table platform_management.user_squad
(
    id          bigserial
        primary key,
    employee_id text                   not null,
    sf_squad_id text                   not null,
    is_active   boolean   default true not null,
    created_at  timestamp default CURRENT_TIMESTAMP,
    created_by  text,
    updated_at  timestamp default CURRENT_TIMESTAMP,
    updated_by  text,
    constraint unique_employee_squad
        unique (employee_id, sf_squad_id)
);
\`\`\`
`;

export const sqlPrompt = `
    以下是将三个企业级BI数据示例（销售趋势分析、客户细分分析、库存周转分析）整理成Markdown文档的格式，包含表结构、用户需求、SQL查询及图表说明，放置在Markdown代码块中：

\`\`\`markdown
# 企业级BI数据示例

本文档提供三个企业级BI数据示例，涵盖常见的复杂数据图表场景，包括表结构、用户需求、SQL查询及图表说明。这些示例适用于销售、市场和供应链等部门的BI分析。

## 示例1：销售趋势分析（折线图）

### 用户需求
销售部门经理希望通过折线图分析过去12个月内各产品类别的月度销售额趋势，以识别增长或下降模式，支持预算规划。

### 表结构
\`\`\`sql
-- 订单表
CREATE TABLE orders (
    order_id INT PRIMARY KEY,
    order_date DATE,
    product_id INT,
    quantity INT,
    unit_price DECIMAL(10, 2),
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);

-- 产品表
CREATE TABLE products (
    product_id INT PRIMARY KEY,
    product_name VARCHAR(100),
    category_id INT,
    FOREIGN KEY (category_id) REFERENCES categories(category_id)
);

-- 产品类别表
CREATE TABLE categories (
    category_id INT PRIMARY KEY,
    category_name VARCHAR(50)
);
\`\`\`

### SQL查询
\`\`\`sql
SELECT 
    c.category_name,
    DATE_FORMAT(o.order_date, '%Y-%m') AS month,
    SUM(o.quantity * o.unit_price) AS total_sales
FROM 
    orders o
JOIN 
    products p ON o.product_id = p.product_id
JOIN 
    categories c ON p.category_id = c.category_id
WHERE 
    o.order_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
GROUP BY 
    c.category_name,
    DATE_FORMAT(o.order_date, '%Y-%m')
ORDER BY 
    c.category_name,
    month;
\`\`\`

### 图表说明
- **图表类型**：折线图（line），以月份为X轴，销售额为Y轴，每条线代表一个产品类别。
- **用途**：展示各产品类别随时间变化的销售趋势，便于发现季节性模式或异常。
- **复杂性**：涉及多表联接（orders、products、categories），时间维度聚合（按月），动态时间范围（最近12个月）。

---

## 示例2：客户细分分析（饼图）

### 用户需求
市场部门需要一个饼图，展示按客户购买总金额分层的客户分布情况（例如：VIP客户、中等客户、低价值客户），以优化营销策略。

### 表结构
\`\`\`sql
-- 客户表
CREATE TABLE customers (
    customer_id INT PRIMARY KEY,
    customer_name VARCHAR(100),
    email VARCHAR(100)
);

-- 订单表
CREATE TABLE orders (
    order_id INT PRIMARY KEY,
    customer_id INT,
    order_date DATE,
    total_amount DECIMAL(10, 2),
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);
\`\`\`

### SQL查询
\`\`\`sql
WITH CustomerSales AS (
    SELECT 
        c.customer_id,
        c.customer_name,
        SUM(o.total_amount) AS total_spent
    FROM 
        customers c
    JOIN 
        orders o ON c.customer_id = o.customer_id
    GROUP BY 
        c.customer_id,
        c.customer_name
),
CustomerSegments AS (
    SELECT 
        customer_id,
        customer_name,
        total_spent,
        CASE 
            WHEN total_spent >= 10000 THEN 'VIP'
            WHEN total_spent >= 5000 THEN 'Medium'
            ELSE 'Low'
        END AS segment
    FROM 
        CustomerSales
)
SELECT 
    segment,
    COUNT(customer_id) AS customer_count,
    ROUND(SUM(total_spent), 2) AS total_revenue
FROM 
    CustomerSegments
GROUP BY 
    segment
ORDER BY 
    total_revenue DESC;
\`\`\`

### 图表说明
- **图表类型**：饼图（pie），展示每个客户分层的占比（基于客户数量或总收入）。
- **用途**：帮助市场团队了解客户价值分布，优化资源分配（如针对VIP客户的专属优惠）。
- **复杂性**：使用CTE（公共表表达式）计算客户总消费，动态分层逻辑（CASE语句），多指标聚合（客户数量和总收入）。

---

## 示例3：库存周转分析（柱状图）

### 用户需求
供应链团队需要一个柱状图，展示各仓库中产品类别的平均库存周转天数（过去6个月），以识别库存管理效率低下的区域。

### 表结构
\`\`\`sql
-- 库存交易表
CREATE TABLE inventory_transactions (
    transaction_id INT PRIMARY KEY,
    product_id INT,
    warehouse_id INT,
    transaction_date DATE,
    quantity INT, -- 正数为入库，负数为出库
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(warehouse_id)
);

-- 产品表
CREATE TABLE products (
    product_id INT PRIMARY KEY,
    product_name VARCHAR(100),
    category_id INT,
    FOREIGN KEY (category_id) REFERENCES categories(category_id)
);

-- 仓库表
CREATE TABLE warehouses (
    warehouse_id INT PRIMARY KEY,
    warehouse_name VARCHAR(50)
);

-- 产品类别表
CREATE TABLE categories (
    category_id INT PRIMARY KEY,
    category_name VARCHAR(50)
);
\`\`\`

### SQL查询
\`\`\`sql
WITH InventoryMetrics AS (
    SELECT 
        w.warehouse_name,
        c.category_name,
        AVG(DATEDIFF(CURDATE(), it.transaction_date)) AS avg_turnover_days,
        SUM(CASE WHEN it.quantity > 0 THEN it.quantity ELSE 0 END) AS total_in,
        SUM(CASE WHEN it.quantity < 0 THEN ABS(it.quantity) ELSE 0 END) AS total_out
    FROM 
        inventory_transactions it
    JOIN 
        products p ON it.product_id = p.product_id
    JOIN 
        categories c ON p.category_id = c.category_id
    JOIN 
        warehouses w ON it.warehouse_id = w.warehouse_id
    WHERE 
        it.transaction_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
    GROUP BY 
        w.warehouse_name,
        c.category_name
    HAVING 
        total_out > 0
)
SELECT 
    warehouse_name,
    category_name,
    ROUND(avg_turnover_days, 2) AS avg_turnover_days
FROM 
    InventoryMetrics
ORDER BY 
    warehouse_name,
    avg_turnover_days DESC;
\`\`\`

### 图表说明
- **图表类型**：柱状图（bar），以仓库为分组，类别为X轴，平均周转天数为Y轴。
- **用途**：帮助供应链团队识别库存周转缓慢的仓库和产品类别，优化库存配置。
- **复杂性**：多表联接（inventory_transactions、products、categories、warehouses），条件聚合（入库/出库数量），时间范围过滤，动态计算周转天数。

---

## 示例图表：销售趋势折线图
以下是基于示例1（销售趋势分析）的折线图配置，用于可视化SQL查询结果：

\`\`\`chartjs
{
  "type": "line",
  "data": {
    "labels": ["2024-06", "2024-07", "2024-08", "2024-09", "2024-10", "2024-11", "2024-12", "2025-01", "2025-02", "2025-03", "2025-04", "2025-05"],
    "datasets": [
      {
        "label": "Electronics",
        "data": [12000, 15000, 13000, 17000, 16000, 18000, 20000, 19000, 21000, 22000, 23000, 24000],
        "borderColor": "#4CAF50",
        "backgroundColor": "rgba(76, 175, 80, 0.2)",
        "fill": false
      },
      {
        "label": "Clothing",
        "data": [8000, 9000, 8500, 9500, 10000, 11000, 12000, 11500, 12500, 13000, 14000, 15000],
        "borderColor": "#2196F3",
        "backgroundColor": "rgba(33, 150, 243, 0.2)",
        "fill": false
      },
      {
        "label": "Home Appliances",
        "data": [5000, 6000, 5500, 6500, 7000, 7500, 8000, 8500, 9000, 9500, 10000, 11000],
        "borderColor": "#FF9800",
        "backgroundColor": "rgba(255, 152, 0, 0.2)",
        "fill": false
      }
    ]
  },
  "options": {
    "responsive": true,
    "plugins": {
      "legend": {
        "position": "top"
      },
      "title": {
        "display": true,
        "text": "Monthly Sales by Product Category"
      }
    },
    "scales": {
      "x": {
        "title": {
          "display": true,
          "text": "Month"
        }
      },
      "y": {
        "title": {
          "display": true,
          "text": "Total Sales ($)"
        },
        "beginAtZero": true
      }
    }
  }
}
\`\`\`

### 图表说明
- **数据来源**：假设的SQL查询结果，包含3个产品类别（Electronics、Clothing、Home Appliances）的月度销售额。
- **颜色**：选择适合明暗主题的颜色（绿色、蓝色、橙色）。
- **用途**：折线图清晰展示各产品类别的销售趋势，适合BI仪表盘。

---

## 总结
以上三个示例（销售趋势、客户细分、库存周转）涵盖了企业BI中常见的复杂分析场景，涉及多表联接、时间维度、条件聚合和分层逻辑。每个SQL查询针对用户需求优化，支持生成复杂的数据图表（如折线图、饼图、柱状图）。如需更多示例或调整，请联系我们！
\`\`\`

---

### 说明
- **结构**：Markdown文档包含标题、简介、三个示例（每个示例包括用户需求、表结构、SQL查询、图表说明），以及一个示例图表（销售趋势折线图）。
- **格式**：使用清晰的Markdown层级（#、##），代码块使用\`\`\`sql和\`\`\`chartjs区分SQL和图表配置。
- **内容**：保留所有原始信息，确保SQL查询和图表配置完整，图表说明与需求紧密相关。
- **可读性**：文档结构清晰，适合技术人员和非技术人员阅读，可直接用于BI项目文档。

如果需要调整文档内容、添加其他图表，或导出为其他格式，请告诉我！
`;
