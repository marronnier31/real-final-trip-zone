package com.kh.trip.domain;

import com.kh.trip.domain.common.BaseTimeEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "WISHLISTS", uniqueConstraints = {
@UniqueConstraint(name ="UK_WISHLISTS_USER_LODGING", 
				  columnNames = {"USER_NO", "LODGING_NO"})
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class WishList extends BaseTimeEntity{
	@Id
	@GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "seq_wishlists")
	@SequenceGenerator(name = "seq_wishlists", sequenceName = "SEQ_WISHLISTS", allocationSize = 1)
	@Column(name = "WISHLIST_NO")
	private Long wishListNo;
	
	@ManyToOne(fetch = FetchType.LAZY)  //외래키(user1명에 찜 여러개 1:n)
	@JoinColumn(name = "USER_NO",nullable = false)
	private User user;
	
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "LODGING_NO",nullable = false)
	private Lodging lodging;
	
}
