#!/bin/bash
# Run this once after Kafka starts to create all topics

KAFKA_BROKER=${KAFKA_BROKER:-localhost:29092}

echo "Creating Kafka topics on $KAFKA_BROKER..."

topics=(
  "post-created:3:1"       # topic:partitions:replication-factor
  "post-liked:3:1"
  "post-commented:3:1"
  "user-registered:1:1"
  "feed-invalidate:3:1"
)

for entry in "${topics[@]}"; do
  IFS=':' read -r topic partitions replication <<< "$entry"
  docker exec -it $(docker ps -q -f name=kafka) \
    kafka-topics --create \
    --bootstrap-server $KAFKA_BROKER \
    --topic $topic \
    --partitions $partitions \
    --replication-factor $replication \
    --if-not-exists
  echo "✅ Topic: $topic (partitions=$partitions)"
done

echo ""
echo "All topics created. Listing:"
docker exec -it $(docker ps -q -f name=kafka) \
  kafka-topics --list --bootstrap-server $KAFKA_BROKER
