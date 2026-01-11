pipeline {
    agent any
    environment {
        DOCKERFILE_PATH = 'Dockerfile'
        REGISTRY_URL = 'registry.sendout.ai'
        IMAGE_NAME = 'red-magic'        
        NPM_TOKEN = 'test'
    }

    stages {
        stage('Setup Environment Variables') {
            steps {
                script {
                    if (env.BRANCH_NAME == 'main') {
                        env.BUILD_TARGET = 'prod'                        
                    } else if (env.BRANCH_NAME == 'dev') {
                        env.BUILD_TARGET = 'dev'
                    } else if (env.BRANCH_NAME == 'stage') {
                        env.BUILD_TARGET = 'stage'
                    } else {
                        timeout(time: 120, unit: 'SECONDS') {
                            env.BUILD_TARGET = input message: "Specify build target for branch ${env.BRANCH_NAME}", parameters: [string(name: 'BUILD_TARGET', defaultValue: 'dev', description: 'Build target')]
                        }
                    }
                }
            }
        }

        // stage('Slack notification for build trigger') {
        //     steps {
        //         script {
        //             def buildUrl = "${env.BUILD_URL}console"
        //             slackSend (
        //                 color: '#ADD8E6',
        //                 message: "Build triggered for *red-magic* branch *${env.BRANCH_NAME}*\nBuild URL: ${buildUrl}"
        //             )
        //         }
        //     }
        // }

        stage('Build and Push Red Magic Docker Image with Kaniko') {
            environment {
                REGISTRY_CREDENTIALS = credentials('registry-kaniko')
                NEXT_PUBLIC_MINIO_ENDPOINT = credentials('NEXT_PUBLIC_MINIO_ENDPOINT')
                NEXT_PUBLIC_MINIO_ID = credentials('NEXT_PUBLIC_MINIO_ID')
                NEXT_PUBLIC_MINIO_KEY = credentials('NEXT_PUBLIC_MINIO_KEY')
                NEXT_PUBLIC_CRM_BACKEND_URL = credentials('NEXT_PUBLIC_CRM_BACKEND_URL')
                NEXT_PUBLIC_CRM_HOST = credentials('NEXT_PUBLIC_CRM_HOST')
                NEXT_PUBLIC_WHITE_WALKER_SOCKET_URL = credentials('NEXT_PUBLIC_WHITE_WALKER_SOCKET_URL')
            }
            steps {
                container('kaniko') {
                    script {
                        echo 'Building and pushing Red Magic Docker image with Kaniko...'
                        sh '''
                        mkdir -p /kaniko/.docker
                        echo $REGISTRY_CREDENTIALS > /kaniko/.docker/config.json
                        /kaniko/executor \
                        --context ${WORKSPACE} \
                        --cache=true \
                        --use-new-run \
                        --snapshot-mode=redo \
                        --dockerfile ${DOCKERFILE_PATH} \
                        --destination ${REGISTRY_URL}/${IMAGE_NAME}:${BUILD_TARGET} \
                        --build-arg NPM_TOKEN=$NPM_TOKEN \
                        --build-arg NEXT_PUBLIC_MINIO_ENDPOINT=$NEXT_PUBLIC_MINIO_ENDPOINT \
                        --build-arg NEXT_PUBLIC_MINIO_ID=$NEXT_PUBLIC_MINIO_ID \
                        --build-arg NEXT_PUBLIC_MINIO_KEY=$NEXT_PUBLIC_MINIO_KEY \
                        --build-arg NEXT_PUBLIC_CRM_BACKEND_URL=$NEXT_PUBLIC_CRM_BACKEND_URL \
                        --build-arg NEXT_PUBLIC_CRM_HOST=$NEXT_PUBLIC_CRM_HOST \
                        --build-arg NEXT_PUBLIC_WHITE_WALKER_SOCKET_URL=$NEXT_PUBLIC_WHITE_WALKER_SOCKET_URL \
                        --target=${BUILD_TARGET}
                        '''
                    }
                }
            }
        }

        stage('Re-deploy Services') {
            steps {
                withKubeConfig([credentialsId: 'sendout-kubernetes']) {
                    script {
                        sh 'curl -LO "https://storage.googleapis.com/kubernetes-release/release/v1.27.7/bin/linux/amd64/kubectl"'
                        sh 'chmod u+x ./kubectl'

                        if (env.BRANCH_NAME == 'main') {
                            echo 'Re-deploying services for production...'
                            sh './kubectl set env deployment/red-magic -n production DEPLOY_DATE="$(date)"'
                        } else if (env.BRANCH_NAME == 'stage') {
                            echo 'Re-deploying services for staging...'
                            sh './kubectl set env deployment/red-magic -n staging DEPLOY_DATE="$(date)"'
                        } else {
                            echo 'Re-deploying services for development...'
                            sh './kubectl set env deployment/red-magic -n development DEPLOY_DATE="$(date)"'
                        }
                    }
                }
            }
        }
    }

    post {
        success {
            script {
                def commitMessage = sh(script: "git log -1 --pretty=%B", returnStdout: true).trim()
                def committerName = sh(script: "git log -1 --pretty=%cn", returnStdout: true).trim()
                def buildUrl = "${env.BUILD_URL}console"
                // slackSend (
                //     color: '#36a64f',
                //     channel: 'devops',
                //     message: "Build successful for *red-magic* branch *${env.BRANCH_NAME}*\nCommit message: *${commitMessage}*\nCommitted by: *${committerName}*\nBuild URL: ${buildUrl}"
                // )
            }
        }
        failure {
            script {
                def commitMessage = sh(script: "git log -1 --pretty=%B", returnStdout: true).trim()
                def committerName = sh(script: "git log -1 --pretty=%cn", returnStdout: true).trim()
                def buildUrl = "${env.BUILD_URL}console"
                // slackSend (
                //     color: '#ff0000',
                //     channel: 'devops',
                //     message: "Build failed for *red-magic* branch *${env.BRANCH_NAME}*\nCommit message: *${commitMessage}*\nCommitted by: *${committerName}*\nBuild URL: ${buildUrl}"
                // )
            }
        }
    }
}
