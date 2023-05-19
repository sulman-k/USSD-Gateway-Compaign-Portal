#!/bin/sh

#Stop execution if error exit
set -e

# Extract the host base url, and add the URL to the APIs
[[ ${BASE_URL} =~ ^https?://[^/]+ ]] && HOST="${BASH_REMATCH[0]}/api/v4"

# GET USER PROFILE
USER_NAME=`curl --silent "${BASH_REMATCH[0]}/api/v4/users/${GITLAB_USER_ID}" -H "PRIVATE-TOKEN:${PRIVATE_TOKEN}" | jq --raw-output '.name'`;

# PROJECTS BASE URL
HOST="${HOST}/projects/";

echo "${HOST}";

# Look which is the default branch
TARGET_BRANCH=`curl --silent "${HOST}${CI_PROJECT_ID}" -H "PRIVATE-TOKEN:${PRIVATE_TOKEN}" | jq --raw-output '.default_branch'`;

# Require a list of all the merge request and take a look if there is already one with the same source branch
LISTMR=`curl --silent "${HOST}${CI_PROJECT_ID}/merge_requests?state=opened" -H "PRIVATE-TOKEN:${PRIVATE_TOKEN}"`;
COUNTBRANCHES=`echo ${LISTMR} | grep -o "\"source_branch\":\"${CI_COMMIT_REF_NAME}\"" | wc -l`;
# No MR found, let's create a new one
if [[ ${COUNTBRANCHES} -eq "0" ]]; then
    BODY="";
    if [[ $CI_COMMIT_REF_NAME == "dev" ]]; then
        echo "Dev Block: Source branch is ${CI_COMMIT_REF_NAME} and Target branch is ${TARGET_BRANCH}";
        BODY="{
            \"id\": ${CI_PROJECT_ID},
            \"source_branch\": \"${CI_COMMIT_REF_NAME}\",
            \"target_branch\": \"staging\",
            \"remove_source_branch\": false,
            \"title\": \"WIP: Merge request created by ${USER_NAME}\",
            \"assignee_id\":\"${GITLAB_USER_ID}\"
        }";
    else
        echo "Staging Block: Source branch is ${CI_COMMIT_REF_NAME} and Target branch is ${TARGET_BRANCH}";
        BODY="{
            \"id\": ${CI_PROJECT_ID},
            \"source_branch\": \"${CI_COMMIT_REF_NAME}\",
            \"target_branch\": \"${TARGET_BRANCH}\",
            \"remove_source_branch\": false,
            \"title\": \"WIP: Merge request created by ${USER_NAME}\",
            \"assignee_id\":\"${GITLAB_USER_ID}\"
        }";
    fi

    echo "Creating a merge request with this payload: ${BODY}";
    curl --silent -X POST "${HOST}${CI_PROJECT_ID}/merge_requests?private_token=${PRIVATE_TOKEN}" \
        -H 'Content-Type: application/json' \
        -H 'cache-control: no-cache' \
        -d "${BODY}";

    echo "Opened a new merge request: WIP: ${CI_COMMIT_REF_NAME} and assigned to you";
    exit;
else
    # OPENED MERGE REQUESTS
    MERGE_NOTE="{
        \"body\": \"WIP:  A merge request is already opened.\"
    }";
    OPENED_MERGE_REQUEST_IID=`curl --silent "${HOST}${CI_PROJECT_ID}/merge_requests?state=opened" -H "PRIVATE-TOKEN:${PRIVATE_TOKEN}" | jq --raw-output '.[0] .iid'`;
    curl --silent -X POST "${HOST}${CI_PROJECT_ID}/merge_requests/${OPENED_MERGE_REQUEST_IID}/notes?private_token=${PRIVATE_TOKEN}" \
        -H 'Content-Type: application/json' \
        -H 'cache-control: no-cache' \
        -d "${MERGE_NOTE}";
    echo "A merge request is already there";
    exit;
fi